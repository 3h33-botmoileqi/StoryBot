class Message{
	/**
	* @property {String} characterName nom du personnage auteur du message
	* @property {String} text text du message
	* @type {Object} payload
	* @property {String} payload.type type du payload attaché au message ["image", "video", "audio"]
	* @property {String} payload.url lien vers le payload
	* @property {Number} timestamp date du message
	* @property {Number} delay delai d'affichage du message
	* @property {Bool} tapeFlag flag définissant si le message neccésite un touch a l'écran pour s'afficher
	* @property {String} side cote sur lequel le message va se placer ["left", "right"]
	* @property {Bool} ads défini si le message contient un placement de produit
	*/
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

	/**
	* Rajoute une / des animation(s) a un message
	* @param {Array<Object>} animArray - liste d'animation
	*/
	AddAnimations(animArray){
		try{
			var json;
			if(typeof animArray == 'string')
				this.animations = JSON.parse(animArray);
			else
				this.animations = animArray;
		}
		catch(err){
			console.log(err);
		}
	}

	/**
	* Remplace le text du message
	* @param {String} text - nouveau text du message
	*/
	changeText(text){
		this.text = text;
	}

	/**
	* crée l'element HTML correspondant a un message
	* @param {Bool} displayMessageDate - défini si la date doit être visible
	* @return {object} Jquery Element du groupe de message généré
	*/
	toDOM(displayMessageDate = true){
		let message = $(`<li class="message message-${this.side}">
					<div class="message-container">
						<div class="${this.text ? "text" : this.payload.type}" ${this.text ? 'contenteditable="false"' : ""}>${this.loadContent()}</div>
						${displayMessageDate ? `<div class="Date">${this.GetTime()}</div>` : ""}
					</div>
				</li>`);
		return message;
	}

	/**
	* fonction de conversation du timestamp en un date affichable
	*/
	GetTime() {
		var date = new Date(this.timestamp*1000);
    var hours = date.getHours();
    var minutes = date.getMinutes();
    /*var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'*/
    minutes = minutes < 10 ? '0'+minutes : minutes;
    var strTime = hours + ':' + minutes;// + ' ' + ampm;
    return strTime;
	}

	/**
	* Gestion du payload d'un message selon son type
	*/
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
                	return "";
            }
		}
	}
}
