var ui;
var db;
var storageService;
$(document).ready(function () {
  //Height adjust
  // let vh = window.innerHeight * 0.01;
  // document.documentElement.style.setProperty('--vh', `${vh}px`);
  // window.addEventListener('resize', () => {
  //   // We execute the same script as before
  //   let vh = window.innerHeight * 0.01;
  //   document.documentElement.style.setProperty('--vh', `${vh}px`);
  // });
  $('#chatPanel').click(function(){
    if(typeof editor !== 'undefined'){
      if(editor.tapeRequiredFlag)
        editor.StoryNextMessage(true);
    }else{
      if(story.tapeRequiredFlag)
        story.StoryNextMessage(true);
    }
    $('#tapeLogo').hide();
  });
  //Firebase
  var config = {
    apiKey: "AIzaSyA3xCApnLi	P26OGADaVD6M93ue0cHzaN3I",
    authDomain: "storybot-68a04.firebaseapp.com",
    databaseURL: "https://storybot-68a04.firebaseio.com",
    projectId: "storybot-68a04",
    storageBucket: "storybot-68a04.appspot.com",
    messagingSenderId: "5815195510"
   };
  firebase.initializeApp(config);
  db = firebase.firestore();
  storageService = firebase.storage();
});

function changePanel(elementId){
  //console.log(elementId);
  if(window.event){
    $(".nav-item").removeClass("active");
    $(window.event.target).parent().addClass("active");
  }
  $('.page').hide();
  $(elementId).show();
  $('.navbar-collapse.show').removeClass("show");
}
//Get URL parameter
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

//## region DeleteStory
function deleteStory(storyRef){
    db.collection("stories").doc(storyRef).get().then(doc => {
        if(doc.exists){
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
//## endregion
