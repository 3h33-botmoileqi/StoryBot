/* Code Editor */
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

let editor = new Editor();
var id;
$(document).ready(function () {
    //Height adjust
    /*let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    window.addEventListener('resize', () => {
      // We execute the same script as before
      let vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    });*/
    firebase.auth().onAuthStateChanged(function(user) {
      id = findGetParameter("id");
      if (user && id != null) {
        // $(".editor-toolbar").collapse();
        db.collection('stories').doc(id).get().then((doc) => {
          if(doc.exists){
            loadStory(doc);
          }else{
            window.location.replace(window.location.origin);
          }
        })
      } else {
        // No user is signed in.
        window.location.replace(window.location.origin);
      }
    });
});

/****************** Date Management ***************************/

//
// function loadStoryConfirm(storyRef, needConfirm = true){
//     ConfirmDialog(
//         "Chargement d'une story",
//         "Vous êtes sur le point de "+( storyRef == null ? "créer une nouvelle story." : "charger une autre story.")+ " Souhaitez vous sauvegarder votre story actuel ?",
//         function(answer){
//             if(answer){
//                 saveStory(login, function(){
//                     loadStory(storyRef);
//                 });
//             }
//             else{
//                 loadStory(storyRef)
//             }
//             $('.story').removeClass('active');
//             $(`#${storyRef}`).addClass('active');
//         }
//     );
// }

function loadStory(doc){
  editor.loadStory(doc.id, doc.data());
  $(".navbar-brand").text(editor.name);
  //link css editor with custom css
  if(editor.config['customCSS'])
    CodeMirrorCustomCSS.setValue(editor.config['customCSS']);
  CodeMirrorCustomCSS.on("change", function(cm){
      editor.loadCSS(cm.getValue());
  });
  localStorage["lastStory"] = doc.id;
  changePanel("#chatPanel");
  editor.StartStoryEditor();
}

function saveStory(callback = null){
        db.collection("stories").doc(id).get().then(doc => {
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
        })
        .catch(err => {
            console.log('Error updating document '+editor.storyRef, err);
        });
    }

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
                            avatar: row.avatar ? row.avatar : "https://cdn.iconscout.com/icon/free/png-256/avatar-380-456332.png",
                            video: row.video ? row.video : "",
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

function findGetParameter(parameterName) {
    var result = null,
        tmp = [];
    location.search
        .substr(1)
        .split("&")
        .forEach(function (item) {
          tmp = item.split("=");
          if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
        });
    return result;
}
/****************************************/

//## region dropzone

Dropzone.autoDiscover = false;

var MessageContentDropzone = new Dropzone("#MessageDropzone", { // Make the whole body a dropzone
  url: '/',
  addRemoveLinks: true,
  method: 'put',
  chunking:true,
  forceChunking:true,
  autoQueue: false,
  autoProcessQueue: false,
  maxFiles:1,
  maxFilesize:25,
  acceptedFiles: "image/*,video/*,audio/*",
  dictDefaultMessage:"Déplacer votre media ici",
  dictInvalidFileType: "Ce fichier n'est pas au bon format",
  dictFileTooBig: "Votre fichier ne dois pas dépasser {{maxFilesize}} Mo (fichier actuel = {{filesize}} Mo)."
});

MessageContentDropzone.on("addedfile", function(file) {
  var reader = new FileReader();
  if (MessageContentDropzone.files.length < 4 ) {
      reader.onload = function(event) {
         // event.target.result contains base64 encoded image
        console.log("file being uploaded ")
        console.log(file);
        storage_upload(event.target.result, file, MessageContentDropzone ,(r)=>{
          console.log("Storage upload response")
          console.log(r)
          $('input[name="payload-url"]').val(r.publicURL);
          $(`input[name="payload-type"][value="${r.type.split("/")[0]}"]`).prop("checked",true);
        })
      };
      reader.readAsDataURL(file);
  }else {
    console.log('skipping file as we are excceding the upload limit')
  }
});

MessageContentDropzone.on("removedfile", function(file){
  var storageRef = firebase.storage().ref("/");
  storageRef.child(file.fullPath).delete().then(
    function(){
     console.log(file.fullPath  + " deleted succefuly")
    }).catch(function(error) {
      console.log("Something is wrong")
      console.log(error)
    });
  });

  var characterAvatarDropzone = new Dropzone("#CharacterDropzone", { // Make the whole body a dropzone
    url: '/',
    addRemoveLinks: true,
    method: 'put',
    chunking:true,
    forceChunking:true,
    autoQueue: false,
    autoProcessQueue: false,
    maxFiles:1,
    maxFilesize:25,
    acceptedFiles: "image/*",
    resizeWidth:48,
    resizeHeight:48,
    dictDefaultMessage:"Déplacer votre avatar ici",
    dictInvalidFileType: "Ce fichier n'est pas au bon format",
    dictFileTooBig: "Votre fichier ne dois pas dépasser {{maxFilesize}} Mo (fichier actuel = {{filesize}} Mo)."
  });
  characterAvatarDropzone.autoDiscover = false;

  characterAvatarDropzone.on("addedfile", function(file) {
    var reader = new FileReader();
    if (characterAvatarDropzone.files.length < 4 ) {
        reader.onload = function(event) {
           // event.target.result contains base64 encoded image
          console.log("file being uploaded ")
          console.log(file);
          storage_upload(event.target.result, file, characterAvatarDropzone ,(r)=>{
            console.log("Storage upload response")
            console.log(r)
            $('input[name="avatar"]').val(r.publicURL);
          })
        };
        reader.readAsDataURL(file);
    }else {
      console.log('skipping file as we are excceding the upload limit')
    }
  });

  characterAvatarDropzone.on("removedfile", function(file){
    var storageRef = firebase.storage().ref("/");
    storageRef.child(file.fullPath).delete().then(
      function(){
       console.log(file.fullPath  + " deleted succefuly")
      }).catch(function(error) {
        console.log("Something is wrong")
        console.log(error)
      });
    });

//## region uploadToFirebase
function storage_upload(filedata, filehandle, DropzoneHandle, cb) {

  // Getting Handle of the progressbar element of current file //
  var progressBar = filehandle.previewElement.children[2]

  // Firestore storage task
  var task
  // uuid for file being uploaded
  //var uuid_string = filehandle.upload.uuid;

  // Getting Storeage referance for file
  var storageRef = storageService.ref("stories" + "/" + id + "/" + filehandle.name );

  // Because I am uploading file in base64 data_url //
  task  = storageRef.putString(filedata, 'data_url');

  // Making progress bar of current file preview element visible
  progressBar.opacity = 1

  task
    .on(firebase.storage.TaskEvent.STATE_CHANGED,

      // Trakcing progress of upload
      function progress(snapshot){
        var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;

        // Updating progressbar width - to make it look like filling
        progressBar.children[0].style.width = progress+'%'

      },

      // Firebase storeage upload error handling
      function(error) {
        // Hanlde your way
        // A full list of error codes is available at
        // https://firebase.google.com/docs/storage/web/handle-errors
      },

      // Finishing process and returing data
      // Returning file-meta and  url
      // and hiding progress bar
      function() {

        // Upload completed successfully, now we can get the meta data of file
        task.snapshot.ref.getMetadata().then(function(meta) {
   // Getting download url of file
          task.snapshot.ref.getDownloadURL().then(function(downloadUrl){
              // storing meta data and download url in object and returning
              // it to callign function ...
              var response = {
                publicURL: downloadUrl,
                type: filehandle.type,
                metainfo: meta
              }
              filehandle.fullPath = meta.fullPath
              return cb(response)
            })
        })

        // Hiding progress bar for current file
        progressBar.style.opacity = 0
      }
    )

}
//## endregion

//## endregion
