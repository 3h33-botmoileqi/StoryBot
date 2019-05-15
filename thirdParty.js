//## region Editor Init Third Party

var CodeMirrorCustomCSS = CodeMirror.fromTextArea(document.getElementById('cssEditor'), {
  mode:  "css",
  lineNumbers: true,
  autofocus: true,
  autoCloseBrackets: true,
  colorpicker : {
      mode : 'edit'
  },
});

CodeMirrorCustomCSS.on("change", function(cm){
    editor.loadCSS(cm.getValue());
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


//## region dropzone

Dropzone.autoDiscover = false;

var messageContentDropzone = new Dropzone("#MessageDropzone", {
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
  dictDefaultMessage:"Déplacer ou cliquer ici pour mettre en ligne vos fichiers",
  dictInvalidFileType: "Ce fichier n'est pas au bon format",
  dictFileTooBig: "Votre fichier ne dois pas dépasser {{maxFilesize}} Mo (fichier actuel = {{filesize}} Mo)."
});

messageContentDropzone.on("addedfile", function(file){
  var reader = new FileReader();
  if (messageContentDropzone.files.length < 4 ) {
      reader.onload = function(event) {
         // event.target.result contains base64 encoded image
        console.log("file being uploaded ")
        console.log(file);
        storage_upload(event.target.result, file, messageContentDropzone ,(r)=>{
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

messageContentDropzone.on("removedfile", function(file){
  var storageRef = firebase.storage().ref("/");
  storageRef.child(file.fullPath).delete().then(
    function(){
     console.log(file.fullPath  + " deleted succefuly")
    }).catch(function(error) {
      console.log("Something is wrong")
      console.log(error)
    });
  });

var characterAvatarDropzone = new Dropzone("#CharacterDropzone", {
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
  dictDefaultMessage:"Déplacer ou cliquer ici pour mettre en ligne vos fichiers",
  dictInvalidFileType: "Ce fichier n'est pas au bon format",
  dictFileTooBig: "Votre fichier ne dois pas dépasser {{maxFilesize}} Mo (fichier actuel = {{filesize}} Mo)."
});

characterAvatarDropzone.on("addedfile", function(file){
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

/**
* Upload To Firebase
*/
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

//## region ExcelExport
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
                var i =0;
                for(let row of characters){
                    if(row.name){
                        let character = {
                            avatar: row.avatar ? row.avatar : "https://cdn.iconscout.com/icon/free/png-256/avatar-380-456332.png",
                            video: row.video ? row.video : "",
                              defaultSide : row.side ? row.side : (i % 2 === 0 ? "left" : "right")
                        }
                        if(!editor.characters[row.name]){
                            editor.insertCharacterEditor(character, row.name);
                        }
                        else{
                            editor.characters[row.character] = character;
                        }
                    }
                    i++;
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
//## endregion
