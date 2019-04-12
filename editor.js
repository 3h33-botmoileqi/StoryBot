var quill = new Quill('#message-editor', {
	theme: 'snow'
});

$(function () {
	$('#datetimepicker1').datetimepicker({date:new Date, locale: 'fr', icons:{time:"fa fa-clock", date:"fa fa-calendar-alt"}});
});

let editor;
$(document).ready(function () {//Height adjust
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    window.addEventListener('resize', () => {
      // We execute the same script as before
      let vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    });
	editor = new Editor($('#chat'), $(".characterList"));
	editor.loadEditor();
	editor.playStory();
});