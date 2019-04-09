class Story {
	constructor(chatElement){
		this.config = {
			"storyName":"New Story",
			"adsEachMessage": -1,
			"displaycharacterName":true,
			"displaycharacterAvatar":true,
			"displayMessageDate":true,
			"customCSS":{}
		};
		this.characters = {};
		this.conversation = [];
		this.messagesGroup = [];
		this.chatElement = chatElement;
		this.id =0;
		this.editor = false;
		this.loadDemo();
	}

	contructor(story, chatElement){

		generateMessagesGroup();
	}

	log(){
		console.log(this);
	}

	waitFor(delay) {
	    return new Promise(resolve => {
	      setTimeout(() => {
	        resolve('resolved');
	      }, delay);
	    });
	  }

	async playStory(){
		this.id=0;
		$(this.chatElement).empty();
		this.generateMessagesGroup();
		var messagesGroup = null;
		var lastCharacter = this.conversation[0].character;
	    let tapeRequiredFlag = false;
	    while(this.id < this.conversation.length && !tapeRequiredFlag){
	      if(this.conversation[this.id].tapeFlag){
	          tapeRequiredFlag = true;
	      }else{
	        await this.waitFor(this.editor ? 0 : this.conversation[this.id].delay);
	        //this.insertChat(array[this.state.displayStory.length], true)
	        //chatElement.append(this.conversation[this.id].output());
	        if(messagesGroup == null || this.conversation[this.id].character !== lastCharacter){
	        	lastCharacter = this.conversation[this.id].character;
	        	messagesGroup = $(`
	        		<li class="messagesGroup">
	        			<div class="messagesGroup-header header-${this.conversation[this.id].side}">
	        				<div>
	        					${this.config.displaycharacterAvatar ? `<img class="avatar" src="${this.characters[lastCharacter].avatar}"/>` : ""}
	        					${this.config.displaycharacterName ? `<h6>${lastCharacter}</h6>` : ""}
	        				</div>
	        			</div>
	        			<ul></ul>
	        		</li>`);
	        	$(this.chatElement).append(messagesGroup);
	        }
	        this.insertMessageElement($(this.conversation[this.id].toDOM(this.editor)), $(messagesGroup).children("ul"));
	        $("body").scrollTop($("body").prop('scrollHeight'));
	        this.id++;
	      }
	    }
	    //Si la story est fini sinon attend un touch
	    if(this.id >= this.conversation.length)
	      console.log('Done!');
	}

	/******************* DOM Management**********************/

	GetIdByMessageElement(element){
		return $(element).index('#chat .message');
	}

	GetMessageElementById(id){
		return $(`#chat .message`).get(id);
	}

	insertMessageElement(message, parent,id=null){
		if(!id){
	        $(parent).append(message);
		}else{

		}
        if(this.editor){
        	this.bindMessageEvent(message);
        }
	}

	bindMessageEvent(message){
        $(message).find('.messageEdit').click(function(){$('.page').hide();$('#messagePanel').show();editor.LoadSelectedMessage(editor.GetIdByMessageElement(message));});
        $(message).find('.messageDelete').click(function(){editor.DeleteMessageEditor(editor.GetIdByMessageElement(message))});
        $(message).find('.text').on('input',function(){editor.onMessageInput(message, $(this).text())});
	}

	EditMessageElement(message, newMessage){
		let newMessageElement = $(newMessage.toDOM(this.editor));
		$(message).replaceWith(newMessageElement);
		this.bindMessageEvent(newMessageElement);
    	this.conversation.splice(this.GetIdByMessageElement(message), 1, newMessage);
	}

	DeleteMessageElement(message){
		var messagesGroup = $(message).closest(".messagesGroup");
		if($(messagesGroup).children().length == 2){
			$(messagesGroup).remove();
		}
		else{
			$(message).remove();
		}
    	this.conversation.splice(this.GetIdByMessageElement(message), 1);
	}

	onMessageInput(message, text){
		this.conversation[this.GetIdByMessageElement($(message))].text = text;
	}


	generateMessagesGroup(){
		this.messagesGroup = [];
		var lastCharacter = this.conversation[0].character;
		var currentPoll = [];
		for (var i = 0; i < this.conversation.length; i++) {
			if(lastCharacter === this.conversation[i].character){
				currentPoll.push(i);
			}else{
				this.messagesGroup.push(currentPoll);
				currentPoll = [i];
				lastCharacter = this.conversation[i].character;
			}
		}
		this.messagesGroup.push(currentPoll);
	}

	/*********************************************************/

	loadDemo(){
		this.characters = {"Personnage1":{"avatar":"https://lh6.googleusercontent.com/-lr2nyjhhjXw/AAAAAAAAAAI/AAAAAAAARmE/MdtfUmC0M4s/photo.jpg?sz=48","side":"left"},"Personnage2":{"avatar":"https://a11.t26.net/taringa/avatares/9/1/2/F/7/8/Demon_King1/48x48_5C5.jpg","side":"right"},"Personnage3":{"avatar":"https://yt3.ggpht.com/a-/AN66SAyjHOM6XYXi_WmTK5F3GJ0pu3G5nQg1gVS4aA=s48-c-k-c0xffffffff-no-rj-mo","side":"left"}}
		var conversation = [{"character":"Personnage1","timestamp":1521374361,"text":"Bonjour !","payload":{},"delay":0,"tapeFlag":false, "side":"left"},{"character":"Personnage2","timestamp":1521374361,"text":"Hey, comment ça va ?","payload":{},"delay":2000,"tapeFlag":false, "side":"right"},{"character":"Personnage1","timestamp":1521374361,"text":"Très bien ! Regarde mon nouveau Poster !","payload":{},"delay":1000,"tapeFlag":false, "side":"left"},{"character":"Personnage1","timestamp":1521374361,"text":"","payload":{"type":"image","url":"https://images.pexels.com/photos/799443/pexels-photo-799443.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500"},"delay":2000,"tapeFlag":false, "side":"left"},{"character":"Personnage3","timestamp":1521374361,"text":"C'est ma photo !","payload":{},"delay":1000,"tapeFlag":false, "side":"left"},{"character":"Personnage2","timestamp":1521374361,"text":"Bravo vous deux !","payload":{},"delay":2000,"tapeFlag":false, "side":"right"},{"character":"Personnage2","timestamp":1521374361,"text":"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.","payload":{},"delay":0,"tapeFlag":false, "side":"right"}];
		for(var message of conversation){
			this.conversation.push(new Message(message.character, message.side, message.text, message.payload, message.timestamp, message.delay, message.tapeFlag, false))
		}
		this.generateMessagesGroup();
		this.log();
	}
}

class Message{
	constructor(characterName, side, text, payload, timestamp, delay, tapeFlag, ads){
		this.character = characterName;
		this.text = text;
		this.payload = payload;
		this.timestamp = timestamp;
		this.delay = delay;
		this.tapeFlag = tapeFlag;
		this.side = side;
		this.ads = ads;
	}

	changeText(text){
		this.text = text;
	}

	toDOM(withEditorTools){
		return `<li class="message message-${this.side}">
					<div class="message-container">
						<div class="${this.text ? "text" : this.payload.type}" ${this.text ? 'contenteditable="true"' : ""}>${this.loadContent()}</div>
						<div class="Date">${this.GetTime()}</div>
					</div>
					${withEditorTools ? '<div class="tools-container"><button class="messageEdit"><i class="fas fa-edit"></i></button><button class="messageDelete"><i class="fas fa-times"></i></button></div>' : ""}
				</li>`;
	}

	GetTime() {
		var date = new Date(this.timestamp*1000);
	    var hours = date.getHours();
	    var minutes = date.getMinutes();
	    var ampm = hours >= 12 ? 'PM' : 'AM';
	    hours = hours % 12;
	    hours = hours ? hours : 12; // the hour '0' should be '12'
	    minutes = minutes < 10 ? '0'+minutes : minutes;
	    var strTime = hours + ':' + minutes;// + ' ' + ampm;
	    return strTime;
	}   

	loadContent(){
		if(this.text !== "")
			return this.text;
		else{
			switch(this.payload.type){
                case "image":
                    return '<img src="'+ this.payload.url+'"/>';
                    break;
                case "video":
                    if(this.payload.url.search("youtube")){
                        return '<iframe width="560" height="315" src="'+this.payload.url.replace("watch?v=", "embed/")+'" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
                    }
                    else{
                        return '<video controls autoplay muted>'+
                                  '<source src="'+this.payload.url+'" type="video/mp4">'+
                                  'Your browser does not support the video tag.'+
                                '</video>';
                    }
                    break;
                case "audio" :
                    return '<audio controls><source src="'+this.payload.url+'" type="audio/mpeg">Your browser does not support the audio element.</audio>';
                    break;
                default:
                	return null;
            }
		}
	}
}

class character{
	contructor(characterName, side, avatarUrl){
		this.characterName = characterName;
		this.defaultSide = side;
		this.avatarUrl = (avatarUrl === "" ? "https://cdn.iconscout.com/icon/free/png-256/avatar-380-456332.png" : avatarUrl);
	}
}

class Editor extends Story{
	constructor(chatElement, charactersList){
		super(chatElement);
		this.editor = true;
		this.charactersList = $(charactersList);
	}

	loadEditor(){
		this.loadCharacters();
		this.loadMessages();
	}

	loadCharacters(){
		let list = this.charactersList;
		$.each(this.characters,function(indexCharacter, character){
			$(list).each(function(indexList, list){
				if($(list).is("#mainCharacterList")){
					$(list).append(`
						<li class="list-group-item d-flex justify-content-between align-items-center">
							${indexCharacter}
							<div class="tools">
								<button class="btn btn-secondary"><i class="fas fa-user-edit"></i></button>
								<button class="btn btn-secondary"><i class="fas fa-times"></i></button>
							</div>
						</li>
						`);
				}else{
					$(list).append(`
						<option value="${indexCharacter}">${indexCharacter}</option
						`);
				}
			})
		});
	}

	loadMessages(){
		this.conversation.forEach(function(message, index){
			let messageItem = editor.messageItemDom(message);
			$("#messageList").append(messageItem);
	        $(messageItem).find('.messageEdit').click(function(){editor.LoadSelectedMessage(index);});
	        $(messageItem).find('.messageDelete').click(function(){editor.DeleteMessageEditor(index)});
		});
	}
	messageItemDom(message){
		return $(`
			<li class="list-group-item d-flex justify-content-between align-items-center">
				${message.text ? message.text : message.payload.type}
				<div class="tools">
					<button class="btn btn-secondary messageEdit"><i class="fas fa-edit"></i></button>
					<button class="btn btn-secondary messageDelete"><i class="fas fa-times"></i></button>
				</div>
			</li>
			`);
	}

	messageFormSubmit(){
		let msgForm = document.forms["messageForm"];
		let isNew = msgForm["isNew"].value;
		let id = msgForm["messageId"].value;
		let message = new Message(
			msgForm["character"].value,
			msgForm["side"].value,
			$(quill.root.innerHTML).html(),
			{type:msgForm["payload-type"].value, url:msgForm["payload-url"].value},
			new Date(msgForm["datetime"].value).getTime() /1000,
			msgForm["delay"].value * 1000,
			msgForm["tapeFlag"].value,
			msgForm["adsFlag"].value
			);
		console.log(isNew);
		if(isNew === "true"){
			console.log("insert");
			this.insertMessageEditor(id, message);	
		}else{
			console.log("edit");
			this.editMessageEditor(id, message);
		}
	}

	insertMessageEditor(){

	}

	editMessageEditor(id, message){
		console.log("edition id:"+id);
		console.log(message);
		this.EditMessageElement($(`#chat .message`).get(id),message)
		$(`#messageList>li:nth-child(${id+1})`).replaceWith(this.messageItemDom(message));
	}

	DeleteMessageEditor(id){
		$(`#messageList>li:nth-child(${id+1})`).remove();
		this.DeleteMessageElement($(`#chat .message`).get(id));
	}

	LoadSelectedMessage(id, isNew = false){
		//TODO
		//Charger le message dans le formulaire de message
		console.log("load message id:"+id)
		let msgForm = document.forms["messageForm"];
		msgForm["messageId"].value = id;
		msgForm["isNew"].value = isNew;
		//INIT FORM
		msgForm["character"].value = "";
		$('#textPayload').show();
		$('#mediaPayload').hide();
		msgForm["payload-type"].value = "";
		msgForm["payload-url"].value= "";
		quill.root.innerHTML = "";
		$('#messageForm-datetimepicker').datetimepicker('date', new Date());
		msgForm["delay"].value = 0;
		msgForm["tapeFlag"].value = false;
		msgForm["adsFlag"].value = false;
		if(!isNew){
			let msg = this.conversation[id];
			msgForm["character"].value = msg.character;
			msgForm["side"].value = msg.side;
			if(msg.text !== ""){

				msgForm["content"].value = "text"; 
				quill.root.innerHTML = msg.text;
			}
			else{
				$('#textPayload').hide();
				$('#mediaPayload').show();

				msgForm["content"].value = "media"; 
				msgForm["payload-type"].value = msg.payload.type;
				msgForm["payload-url"].value = msg.payload.url;
			}
			$('#messageForm-datetimepicker').datetimepicker('date', new Date(msg.timestamp*1000));
			msgForm["delay"].value = msg.delay/1000;
			$("#delayOutput").text(msgForm["delay"].value+" sec");
			msgForm["tapeFlag"].value = msg.tapeFlag;
			msgForm["adsFlag"].value = msg.ads;
		}
	}

	//TODO Delete / Edition fonction & event pour Character & Message
	//TODO Scroll to messageId
}