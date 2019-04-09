var quill = new Quill('#message-editor', {
	theme: 'snow'
});

$(function () {
	$('#messageForm-datetimepicker').datetimepicker({date:new Date});
});

let editor;
$(document).ready(function () {
	editor = new Editor($('#chat'), $(".characterList"));
	editor.loadEditor();
	editor.playStory();
});