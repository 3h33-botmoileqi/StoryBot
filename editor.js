var CodeMirror = CodeMirror.fromTextArea(document.getElementById('cssEditor'), {
  mode:  "css",
  lineNumbers: true,
  autofocus: true,
  autoCloseBrackets: true,
  colorpicker : {
      mode : 'edit'
  },
});

var quill = new Quill('#message-editor', {
	theme: 'snow'
});

$(function () {
	$('#datetimepicker1').datetimepicker({date:new Date, locale: 'fr', icons:{time:"fa fa-clock", date:"fa fa-calendar-alt"}});
});

let editor;
$(document).ready(function () {
    $(".buttonPage").click(function(){$(".buttonPage").removeClass("active");$(this).addClass("active")})
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
    CodeMirror.setValue(editor.config['customCSS']);
    CodeMirror.on("change", function(cm){
        editor.loadCSS(cm.getValue());
    });
	editor.playStory();
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

