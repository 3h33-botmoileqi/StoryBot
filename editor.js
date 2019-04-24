var CodeMirrorCustomCSS = CodeMirror.fromTextArea(document.getElementById('cssEditor'), {
  mode:  "css",
  lineNumbers: true,
  autofocus: true,
  autoCloseBrackets: true,
  colorpicker : {
      mode : 'edit'
  },
});

var CodeMirrorAnimations = CodeMirror.fromTextArea(document.getElementById('animationsEditor'), {
  mode:  "javascript",
  lineNumbers: true,
  autoCloseBrackets: true,
  colorpicker : {
      mode : 'edit'
  },
});

var quill = new Quill('#message-editor', {
	theme: 'snow'
});

var quillCharDesc = new Quill('#charDesc-editor', {
    theme: 'snow'
});

$(function () {
	$('#datetimepicker1').datetimepicker({date:new Date, locale: 'fr', icons:{time:"fa fa-clock", date:"fa fa-calendar-alt"}});
});

let editor;
$(document).ready(function () {
    $(".buttonPage").click(function(){$(".buttonPage").removeClass("active");$(this).addClass("active")});
    $("#chatPanel").click(function(){if(editor.tapeRequiredFlag){editor.StoryNextMessage(true);$("#tapeLogo").hide();}})
    //Height adjust
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    window.addEventListener('resize', () => {
      // We execute the same script as before
      let vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    }); 

    editor = new Editor();

    if(localStorage["lastLogin"]){
            login = localStorage["lastLogin"];
            loginAccepted(login);
            if(localStorage["lastStory"]){
                loadStory(localStorage["lastStory"], false);
            }else{
                editor.changePanel("#cloudPanel");
            }
    }
    else
        editor.changePanel("#loginPanel");

    //link css editor with custom css
    CodeMirrorCustomCSS.setValue(editor.config['customCSS']);
    CodeMirrorCustomCSS.on("change", function(cm){
        editor.loadCSS(cm.getValue());
    });
	editor.StartStoryEditor();
});
/****************** Date Management ***************************/
function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}
let login = null;
let loginRef = null;
function loginFormSubmit(){
    login = document.forms["loginForm"]["login"].value.toLowerCase();
    if(validateEmail(login)){
        db.collection('users').doc(login).get().then(doc => {
            if (!doc.exists) {
                console.log('New User');
                db.collection("users").doc(login).set({});
            }
            if(document.forms["loginForm"]["remember"].checked)
                loginref = doc.ref;
                localStorage["lastLogin"] = login;
            loginAccepted(login)
        })
        .catch(err => {
            console.log('Error getting document', err);
        })
    }else{
        alert("email invalide");
    }
}

function loginAccepted(login){
    editor.changePanel("#cloudPanel");
    editor.AddAuthor(login);
    $("#authorsForm").show();
    loadStories(login);
}
function loadStories(login){
    $("#storiesList").empty();
    var docRef = db.collection("users").doc(login);
    db.collection("stories").where('authors', 'array-contains', docRef).get().then(snapshot => {
        if (snapshot.empty) {
          $("#storiesList").append(`
            <li class="list-group-item d-flex align-items-center">
                    <div class="flex-grow-1 text">Aucune Story retrouvée</div>
            </li>`);
          return;
        }
        snapshot.forEach(doc => {
            //dom Element 
            var storyItem = $(`
                <li id="${doc.id}" class="list-group-item d-flex align-items-center story ${doc.id == editor.storyRef ? "active" : ""}">
                    <div class="flex-grow-1 text">${doc.data().name}</div>
                    <div class="btn-group">
                        <button class="btn btn-secondary storyLoad" onclick=""><i class="fas fa-edit"></i></button>
                        <button class="btn btn-secondary storyDelete" onclick=""><i class="fas fa-times"></i></button>
                    </div>
                </li>`);
            //Load Event
            storyItem.find(".storyLoad").click(function(){
                loadStoryConfirm(doc.id);
            });
            //DeleteEvent
            storyItem.find(".storyDelete").click(function(){
                deleteStory(doc.id);
            });
            //Add to Dom
            $("#storiesList").append(storyItem);
        });
    })
  .catch(err => {
    console.log('Error getting documents', err);
  });
}

function loadStoryConfirm(storyRef, needConfirm = true){
    ConfirmDialog(
        "Chargement d'une story",
        "Vous êtes sur le point de "+( storyRef == null ? "créer une nouvelle story." : "charger une autre story.")+ " Souhaitez vous sauvegarder votre story actuel ?",
        function(answer){
            if(answer){
                saveStory(login, function(){
                    loadStory(storyRef);
                });
            }
            else{
                loadStory(storyRef)
            }
            $('.story').removeClass('active');
            $(`#${storyRef}`).addClass('active');
        }
    );
}

function loadStory(storyRef){
    if(storyRef !== null){
        db.collection('stories').doc(storyRef).get().then((doc) => {
            if(doc.exists){
                editor.loadStory(storyRef, doc.data());
                localStorage["lastStory"] = storyRef;
                editor.changePanel("#chatPanel");
                editor.StartStoryEditor();
            }
            /*else{
                delete localStorage["lastStory"];
            }*/
        })
        .catch(err => {
            console.log('Error getting documents', err);
        });
    }
    else{
        editor = new Editor();
        editor.storyRef = null;
        editor.AddAuthor(login);
        editor.changePanel("#chatPanel");
        editor.StartStoryEditor();
    }
}

function deleteStory(storyRef){
    db.collection("stories").doc(storyRef).get().then(doc => {
        if(doc.exists){
            /*var answer = prompt(`Vous êtes sur le point de supprimer la story \"${doc.data().name}\". Confirmer la suppression en inséré "supprimer" ci-dessous.`)
            if(answer.toLowerCase() == "supprimer"){
            }*/
            ConfirmDeleteDialog(
                "Suppresion d'une Story",
                `Vous êtes sur le point de supprimer la story \"${doc.data().name}\". Confirmer la suppression en insérant <b>"supprimer"</b> ci-dessous.`,
                function(){
                    if(localStorage["lastStory"] == doc.id){
                        delete localStorage["lastStory"];
                     }
                    $(`#${doc.id}`).remove();
                    doc.ref.delete();
                }
            );
        }
    })
    .catch(err => {
        console.log('Error deleting document', err);
    })
}

function saveStory(login, callback = null){
    if(editor.storyRef != null){
        db.collection("stories").doc(editor.storyRef).get().then(doc => {
            if(doc.exists){
                doc.ref.update({
                    name: editor.name,
                    config: editor.config,
                    characters: editor.characters,
                    conversation: editor.conversation.map((obj)=> {return Object.assign({}, obj)})
                })
                localStorage["lastStory"] = doc.id;
                if(callback != null){
                    callback();
                }
            }else{
                db.collection("stories").add({
                    authors: editor.authors,
                    name: editor.name,
                    config: editor.config,
                    characters: editor.characters,
                    conversation: editor.conversation.map((obj)=> {return Object.assign({}, obj)})
                }).then(doc => {
                    localStorage["lastStory"] = doc.id;
                    editor.storyRef = doc.id;
                    loadStories(login);
                    if(callback != null){
                        callback();
                    }
                })
                .catch(err => {
                    console.log('Error adding document', err);
                })
            }
        })
        .catch(err => {
            console.log('Error updating document '+editor.storyRef, err);
        });
    }else{
        db.collection("stories").add({
            authors: editor.authors,
            name: editor.name,
            config: editor.config,
            characters: editor.characters,
            conversation: editor.conversation.map((obj)=> {return Object.assign({}, obj)})
        }).then(doc => {
            localStorage["lastStory"] = doc.id;
            editor.storyRef = doc.id;
            loadStories(login);
            if(callback != null){
                callback();
            }
        })
        .catch(err => {
            console.log('Error adding document', err);
        })
    }}

/**************************************************************/

function ConfirmDialog(title, message, callback) {
    $('<div></div>').appendTo('body')
    .html('<div><h6>'+message+'</h6></div>')
    .dialog({
        modal: false, title: title, zIndex: 10000, autoOpen: true,
        width: 'auto', resizable: false,
        buttons: {
            Oui: {
                click:function () {     
                    $(this).dialog("close");
                    callback(true)
                },
                text: "Oui",
                class: 'btn btn-success'
            },
            Non: {
                click:function () {     
                    $(this).dialog("close");
                    callback(false)
                },
                text:"Non",
                class: 'btn btn-danger'
            }
        },
        close: function (event, ui) {
            $(this).remove();
        }
    });
};

function ConfirmDeleteDialog(title, message, callback) {
    $('<div></div>').appendTo('body')
    .html('<div><h6>'+message+'</h6><br><label>Confirmation : </label> <input type="text" id="confirmDelete"></div>')
    .dialog({
        modal: false,
        title: title,
        zIndex: 10000,
        autoOpen: true,
        width: 'auto',
        resizable: false,
        buttons: {
            confirm: {
                click:function () {
                    if($("#confirmDelete").val() === "supprimer"){
                        callback();
                    }
                    $(this).dialog("close");
                },
                text: "Supprimer",
                class: 'btn btn-danger'
            }
        },
        close: function (event, ui) {
            $(this).remove();
        },
    });
};

function ImportExcel(title, message, callback) {
    $('<div></div>').appendTo('body')
    .html('<div><h6>'+message+'</h6></div>')
    .dialog({
        modal: false,
        title: title,
        zIndex: 10000,
        autoOpen: true,
        width: 'auto',
        resizable: false,
        buttons: {
            add: {
                click:function () {
                    $(this).dialog("close");
                    callback();
                },
                text: "Ajouter",
                class: 'btn btn-success'
            },
            replace: {
                click:function () {
                    $(this).dialog("close");
                    editor.characters = {};
                    editor.conversation = [];
                    editor.loadEditor();
                    callback();
                },
                text: "Remplacer",
                class: 'btn btn-danger'
            },
            cancel: {
                click:function () {
                    $(this).dialog("close");
                },
                text: "Annuler",
                class: 'btn btn-secondary'
            }
        },
        close: function (event, ui) {
            $(this).remove();
        },
    });
};


/****************************************/
let parseExcel = function(file) {
    var reader = new FileReader();

    reader.onload = function(e) {
        var data = e.target.result;
        var workbook = XLSX.read(data, {
        type: 'binary'
        });
        var error ="";
        ImportExcel(
        "ImportExcel",
        "Vous êtes sur le point d'effectuer un import Excel. Que souhaitez vous faire ?",
        function(){
            //Chars
            if(workbook.Sheets["characters"]){
                var characters = XLSX.utils.sheet_to_row_object_array(workbook.Sheets["characters"]);
                for(let row of characters){
                    if(row.name){
                        let character = {
                            avatar: row.avatar? row.avatar : "https://cdn.iconscout.com/icon/free/png-256/avatar-380-456332.png",
                            defaultSide : row.side ? row.side : "left"  
                        }
                        if(!editor.characters[row.name]){
                            editor.insertCharacterEditor(character, row.name);
                        }
                        else{
                            editor.characters[row.character] = character;
                        }
                    }
                }
            }
            //Conv
            if(workbook.Sheets["conversation"]){
                var conversation = XLSX.utils.sheet_to_row_object_array(workbook.Sheets["conversation"]);
                for(let rowIndex in conversation){
                    if(editor.characters[conversation[rowIndex].character] && conversation[rowIndex].text){
                        let message = new Message(
                            conversation[rowIndex].character,
                            conversation[rowIndex].side ? conversation[rowIndex].side : editor.characters[conversation[rowIndex].character].defaultSide,
                            conversation[rowIndex].text,
                            {},
                            conversation[rowIndex].datetime ? new Date(conversation[rowIndex].datetime).getTime() /1000 : new Date().getTime() /1000,
                            conversation[rowIndex].delay ? conversation[rowIndex].delay : 0,
                            conversation[rowIndex].tapeFlag ? conversation[rowIndex].tapeFlag : true,
                            conversation[rowIndex].ads ? conversation[rowIndex].ads : false
                        );
                        editor.insertMessageEditor(editor.conversation.length, message);
                    }
                    else{
                        if(error === "")
                            error = "Erreur survenue durant l'import :\n"
                        error += `- ligne ${rowIndex} : Personnage introuvable\n`
                    }
                }
            }
            if(error !== ""){
                alert(error);
            }
        }
    );
      /*workbook.SheetNames.forEach(function(sheetName) {
        // Here is your object
        var XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
        //var json_object = JSON.stringify(XL_row_object);
        console.log(XL_row_object);
      })*/
      $("#excelInput").val("");
    };

    reader.onerror = function(ex) {
      console.log(ex);
    };

    reader.readAsBinaryString(file);
};
/****************************************/