var quill = new Quill('#message-editor', {
	theme: 'snow'
});

$(function () {
	$('#datetimepicker1').datetimepicker({date:new Date, locale: 'fr', icons:{time:"fa fa-clock", date:"fa fa-calendar-alt"}});
});

let editor;
$(document).ready(function () {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
	editor = new Editor($('#chat'), $(".characterList"));
	editor.loadEditor();
	editor.playStory();
});