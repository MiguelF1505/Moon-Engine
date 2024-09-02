const canvas = document.getElementById("c");
const ctx = canvas.getContext('2d', { alpha: false });
var PK = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
0,0,0,0,0,0,0,0,0,0];
var PKLF = Clone(PK);
var MP = [false,false,false,false,false]
var MPLF = [false,false,false,false,false]
var oldTime = Date.now();
var dt = 0;
var CamX = 0;
var CamY = 0;
var CamSize = 1;
const soundRedundancy = 3;
//used for sprite rotations
const Radians = Math.PI / 180;
var Colliders = [];
var Objects = [];
var oldScene = -1;
var scene = 0;
var Scenes = [];
var renderRequests = [];
var inputs = [87, 65, 83, 68, 69];
var SizeCanvas = 1;
canvas.height = window.innerHeight - 4;
canvas.width = canvas.height * 1.78;
canvas.addEventListener('contextmenu', event => event.preventDefault());
var mainPathImg = new Image();
mainPathImg.src = "./images/";
mainPathImg = mainPathImg.src;
var renderCols = true;
var persistantData = [0, 1]; // ? ; master volume

function RngInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1) ) + min;
}

function RngFloat(min, max) {
	return (Math.random() * (max - min)) + min;
}

function RenderText(stringText, x, y, size, centered){
	let xS = x;
	
	if(centered != undefined){
		xS -= (stringText.length - 1) * size * 0.5;
	}
	
	let letId = 0;
	let nw;
	let nh;
	let imgFind;
	
	for(let i = 0; i < stringText.length; i++){
		imgFind = GetLetterId(stringText[i]);
		letId = SprFind(imgFind.src, true);
		nw = imgFind.naturalWidth;
		nh = imgFind.naturalHeight;
		if(nw > nh){
			nh = nh / nw;
			nw = 1;
		}else{
			nw = nw / nh;
			nh = 1;
		}
		renderUi(xS + (i * size), y, size * nw, size * nh, letId);
	}
}

function RenderNumber(num, x, y, size, centered){
	let xS = x;
	let numstring = num.toString();
	
	if(centered != undefined){
		xS -= (numstring.length - 1) * size * 0.5;
	}
	
	let letId = numsImg[10];
	let imgFind = imgs[letId];
	let nw;
	let nh;

	if(num < 0){
		renderUi(xS, y, size, size, letId);
	}

	for(let i = num < 0 ? 1 : 0; i < numstring.length; i++){
		letId = numsImg[parseInt(numstring[i])];
		imgFind = imgs[letId];
		nw = imgFind.naturalWidth;
		nh = imgFind.naturalHeight;
		if(nw > nh){
			nh = nh / nw;
			nw = 1;
		}else{
			nw = nw / nh;
			nh = 1;
		}
		renderUi(xS + (i * size), y, size * nw, size * nh, letId);
	}
}

class obj{
	constructor(xa, ya, width, height){
		this.position = {
			x: xa,
			y: ya
		}
		this.width = width;
		this.height = height;
		this.id = Objects.length;
		Objects.push(this);
	}
	
	update(){
		if(this.par != null){
			this.par.update();
		}
	}
	
	destroy(){
		if(this.par != null){
			this.par.destroy();
			this.par = null;
		}
	}
}

class Sprite extends obj{	
	constructor(x, y, width, height, imgId, isDone){
		super(x, y, width, height);
		this.img = 0;
		this.nWidth = 0;
		this.nHeight = 0;
		if(isDone == true){
			this.imgIdx = imgId;
			for(let i = 0; i < imgs.length; i++){
				if(imgs[i].src == this.imgIdx.src){
					this.imgIdx = i;
					this.img = imgs[this.imgIdx];
					i = imgs.length;
				}
			}
		}else{
			this.changeSprite(imgId);
		}
		this.flipX = false;
		this.flipY = false;
		this.rotation = 0;
		this.par = this;
		this.OfX = 1;
		this.OfY = 1;
		this.brightness = 1;
		this.ghost = 1;
	}
	
	changeSprite(imgId, done){
		if(done == true){
			this.imgIdx = SprFind(imgId.src, true);
		}else if(done == 'id'){
			this.imgIdx = imgId;
			this.img = imgs[this.imgIdx];
		}else{
			this.imgIdx = mainPathImg + imgId + ".png";
			for(let i = 0; i < imgs.length; i++){
				if(imgs[i].src == this.imgIdx){
					this.imgIdx = i;
					i = imgs.length;
				}
			}
		}
		
		this.img = imgs[this.imgIdx];
	}
	
	update(){}

	draw(){
		let x = this.position.x - CamX + 500;
		let y = this.position.y - CamY + 300;
		
		if(this.img.naturalHeight < this.img.naturalWidth){
			this.nWidth = this.width;
			this.nHeight = (this.img.naturalHeight / this.img.naturalWidth) * this.height;
		}else{
			this.nWidth = this.width * (this.img.naturalWidth / this.img.naturalHeight);
			this.nHeight = this.height;
		}
		
		let halfX = this.nWidth / 2;
		let halfY = this.nHeight / 2;
		
		if(x - halfX > (1000 + halfX) * CamSize || y - halfY > (600 + halfY) * CamSize || x + halfX < -(halfX + 500) * CamSize || y + halfY < -halfY * CamSize * CamSize){
			return;
		}
		
		let xc = 1;
		let yc = 1;
		
		ctx.save();
		
		if(this.brightness != 1 && this.ghost != 1){
			ctx.filter = 'brightness(' + this.brightness + ')' + 'opacity(' + this.ghost + ')';
		}
		
		if(this.flipX){
			x = -x;
			xc = -1;
		}
		if(this.flipY){
			y = -y;
			yc = -1;
		}
		
		
		ctx.scale(xc, yc);
		ctx.translate(Math.floor((x + (500 * (CamSize - 1))) * SizeCanvas), Math.floor(y + (300 * (CamSize - 1))) * SizeCanvas);
		
		ctx.rotate(this.rotation * Radians);
		
		/*
		ctx.drawImage(this.img, Math.floor(-halfX * SizeCanvas * this.OfX), Math.floor(-halfY * SizeCanvas * this.OfY),
		Math.floor(this.nWidth * SizeCanvas), Math.floor(this.nHeight * SizeCanvas));
		*/

		halfX = (-halfX * SizeCanvas * this.OfX) + ((-halfX * SizeCanvas * this.OfX) < 0 ? -1 : 0) >> 0;
		halfY = (-halfY * SizeCanvas * this.OfY) + ((-halfY * SizeCanvas * this.OfY) < 0 ? -1 : 0) >> 0;

		let nWidth = (this.nWidth * SizeCanvas) + ((this.nWidth * SizeCanvas) < 0 ? -1 : 0) >> 0;
		let nHeight = (this.nHeight * SizeCanvas) + ((this.nHeight * SizeCanvas) < 0 ? -1 : 0) >> 0;

		ctx.drawImage(this.img, halfX, halfY, nWidth, nHeight);
		//ctx.drawImage(this.img, halfX, halfY, 100, 100);
		
		ctx.restore();
	}
	
	destroy(){}
}

function SprFind(sprName, fullSrc){
	let p;
	if(fullSrc === true){
		p = sprName;
	}else{
		p = mainPathImg + sprName + ".png";
	}
	for(let i = 0; i < imgs.length; i++){
		if(imgs[i].src === p){
			return i;
		}
	}
	
	return 0;
}

function GetLetterId(letter){
	for(let i = 0; i < Alphabet.length; i++){
		if(Alphabet[i] == letter.toUpperCase() || Alphabet[i] == letter){
			return lettersImg[i];
		}
	}
}

class Collider{
	constructor(x, y, width, height, tag, par){
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.tag = tag;
		if(par == undefined){
			par = this;
		}else{
			this.par = par;
		}
		this.id = Colliders.length;
		Colliders.push(this);
	}
	
	CheckForCollisions(compareTag, retPar){
		let Size = canvas.width / 1000;
		let ret = null;
		let halfX = this.width / 2 * Size;
		let halfY = this.height / 2 * Size;
		let OHalfX;
		let OHalfY;
		let checkX = 0;
		let checkY = 0;
		let x = this.x * Size;
		let y = this.y * Size;
		
		for(let i = 0; i < Colliders.length; i++)
		{
			checkX = Colliders[i].x * Size;
			checkY = Colliders[i].y * Size;
			OHalfX = Colliders[i].width / 2 * Size;
			OHalfY = Colliders[i].height / 2 * Size;
			if(compareTag == null || compareTag == Colliders[i].tag && Colliders[i] != this){
				if(x + halfX >= checkX - OHalfX && x - halfX <= checkX + OHalfX){
					if(y + halfY >= checkY - OHalfY && y - halfY <= checkY + OHalfY){
						if(retPar == false){
							ret = Colliders[i].id;
						}else{
							ret = Colliders[i].par;								
						}
						return ret;
					}
				}
			}
		}
		
		return null;
	}
	
	CheckAllCollisions(compareTag){
		let colls = [];
		
		let Size = canvas.width / 1000;
		let ret = null;
		let halfX = this.width / 2 * Size;
		let halfY = this.height / 2 * Size;
		let OHalfX;
		let OHalfY;
		let checkX = 0;
		let checkY = 0;
		let x = this.x * Size;
		let y = this.y * Size;
		
		for(let i = 0; i < Colliders.length; i++)
		{
			checkX = Colliders[i].x * Size;
			checkY = Colliders[i].y * Size;
			OHalfX = Colliders[i].width / 2 * Size;
			OHalfY = Colliders[i].height / 2 * Size;
			
			if(compareTag == null || compareTag == Colliders[i].tag && Colliders[i] != this){
				if(x + halfX >= checkX - OHalfX && x - halfX <= checkX + OHalfX){
					if(y + halfY >= checkY - OHalfY && y - halfY <= checkY + OHalfY){
						colls.push(Colliders[i]);
					}
				}
			}
		}
		
		return colls;
	}
}

class MyMouse{
	
	constructor(HitboxSize){
		this.x = 0;
		this.y = 0;
		this.isOnUi = false;
		this.col = new Collider(0, 0, HitboxSize, HitboxSize, "mouse", this);
	}
}

const mouse = new MyMouse(2);

//do not call this
function OnMouseMove(event){
	if(mouse != null){
		mouse.x = event.clientX - ((window.innerWidth - canvas.width) / 2);
		mouse.y = event.clientY;
		let scale = canvas.width / 1000;
		
		mouse.x /= scale;
		mouse.y /= scale;
		
		//mouse.x += CamX;
		//mouse.y += CamY;
		
		mouse.col.x = mouse.x - 500;
		mouse.col.y = mouse.y - 300;
	}
}

class Button extends obj{
	constructor(x, y, width, height, imgId, buttonId, callBack){
		super(x, y, width, height);
		this.par = this;
		this.imgIdx = SprFind("UI/buttons/" + imgId);
		this.buttonId = buttonId;
		this.col = new Collider(this.position.x, this.position.y, this.width, this.height, "button", this);
		this.callBack = callBack;
		//pressing
		this.p = false;
	}
	
	update(){
		if(this.col.CheckForCollisions('mouse', true) != null){
			if(!MPLF[0] && MP[0]){
				this.p = true;
			}else if(this.p && !MP[0]){
				this.callBack.OnClick(this.buttonId);
				this.p = false;
			}
		}else if(!MP[0]){
			this.p = false;
		}
		addDrawRequest(this, 5000);
	}
	
	draw(){
		this.t += dt;
		renderUi(this.position.x, this.position.y, this.width, this.height, this.imgIdx);
	}
	
	destroy(){
		deleteCollider(this.col.id);
	}
}

class MenuScene{
	constructor(){

	}
	
	start(){
		new Button(0, 0, 50, 50, 'BG', 0, this);
		CamX = 0;
		CamY = 0;
	}
	
	OnClick(buttonId){
		if(buttonId == 0){
			scene = 1;
		}
	}
	
	update(){

	}
	
	ui(){
		RenderNumber(Math.floor(musicManager.timerMusic * 100), 100, 100, 50, true);
	}
}

class GameScene{
	constructor(){
		
	}
	
	start(){
		player = new Player(0, 0, 30, 30);
	}
	
	update(){

	}
	
	ui(){

	}
	
}

class Player extends obj{
	constructor(x, y, width, height){
		super(x, y, width, height);
		this.col = new Collider(x, y, width, height, 'player', this);
		this.spr = new Sprite(x, y, width, height, 'BG');
	}
	
	update(){
		this.col.x = this.position.x;
		this.col.y = this.position.y;
		addDrawRequest(this, 5);
	}
	
	draw(){
		this.spr.position.x = this.position.x;
		this.spr.position.y = this.position.y;
		this.spr.draw();
	}

	destroy(){
		
	}
}

function GetDistance(pos1, pos2){
	let x = pos1.x - pos2.x;
	let y = pos1.y - pos2.y;
	
	return Math.sqrt(x*x + y*y);
}

//gets if rotation is clockwise or counterclockwise
function DirMultFromTo(current, wants){
	if(current < wants){
		return 1;
	}else{
		return -1;
	}
}

function DirFromTo(pos1, pos2){
	let dx = -pos1.x + pos2.x;
	let dy = -pos1.y + pos2.y;
	return Math.atan2(dy, dx);
}

function addDrawRequest(idx, zOrder){
	let i = 0;
	while(i < renderRequests.length && zOrder >= renderRequests[i].z){
		i++;
	}
	renderRequests.splice(i, 0, {idx: idx, z: zOrder});
}

function renderUi(x, y, width, height, imgId, effects){
	
	if(effects != undefined){
		ctx.filter = effects;
	}
	
	ctx.imageSmoothingEnabled = false;
	ctx.drawImage(imgs[imgId], (500 + x - (width / 2)) * (canvas.width / 1000), (300 + y - (height / 2)) * (canvas.width / 1000), width * (canvas.width / 1000), height * (canvas.width / 1000));
}

function renderAll(){
	for(let i = 0; i < renderRequests.length; i++){
		renderRequests[i].idx.draw();
	}
	renderRequests = [];
}

function deleteObject(idx){
	Objects[idx].destroy();
	Objects[idx] = null;
	Objects.splice(idx, 1);
	for(let i = idx; i < Objects.length; i++){
		Objects[i].id--;
	}
}

function deleteCollider(idx){
	Colliders[idx] = null;
	Colliders.splice(idx, 1);
	for(let i = idx; i < Colliders.length; i++){
		Colliders[i].id--;
	}
}

function SetPos(pos1, pos2){
	pos1.x = pos2.x;
	pos1.y = pos2.y;
}

function PlaySound(soundPath, volumeAmm){
	let id = getSoundId(soundPath)
	let audio = sounds[id][soundsMult[id]];
	audio.pause();
	audio.currentTime = 0;
	soundsMult[id]++;
	if(soundsMult[id] > 3){
		soundsMult[id] = 0;
	}
	if(volumeAmm == undefined){
		audio.volume = 1  * persistantData[1];
	}else{
		audio.volume = volumeAmm  * persistantData[1];
	}
	audio.play();
	return audio;
}

function mainStart(){
	Scenes = [new MenuScene(), new GameScene()];
	ctx.imageSmoothingEnabled = false;

	for(let a = 0; a < 10; a++){
		numsImg.push(SprFind("Text/" + a));
	}
	numsImg.push(SprFind("Text/-"));
	
	for(let a = 0; a < Alphabet.length; a++){
		if(Alphabet[a] != ' '){
			lettersImg.push(imgs[SprFind("Text/" + Alphabet[a])]);
		}else{
			lettersImg.push(imgs[SprFind("Text/_")]);
		}
	}
	
	Scenes[scene].start();
	oldScene = scene;
	update();
}

var frRate = 1;
var frChange = 0;

function update(){
	if(canvas.height != window.innerHeight){
		canvas.height = window.innerHeight;
		canvas.width = canvas.height * 1.7778;
		canvas.style.left = Math.ceil((window.innerWidth - canvas.width) / 2) + "px";
		canvas.style.top = "0%";
		canvas.style.position = "absolute";
		ctx.imageSmoothingEnabled = false;
	}else{
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	}

	SizeCanvas = canvas.width / (1000 * CamSize);

	//renderUi(0, 0, 1000, 600, 2);

	let now = Date.now();
	dt = now - oldTime;
	dt *= 0.001 * gameSpeed;
	if(dt > 0.02){
		dt = 0.02;
	}
	Scenes[scene].update();
	for(let i = 0; i < Objects.length; i++){
		Objects[i].update();
	}
	if(oldScene != scene){
		let objL = Objects.length;
		for(let i = 0; i < objL; i++){
			if(Objects[0] == null){
				break;
			}
			deleteObject(0);
		}
		Objects = [];
		for(let i = 0; i < Colliders.length; i++){
			if(Colliders[i].tag != "mouse"){
				deleteCollider(i);
			}
		}
		Colliders = [Colliders[0]];
		
		if(scene == -1){
			scene = oldScene;
		}else{
			oldScene = scene;
		}
		Scenes[scene].start();
	}
	
	oldTime = now;
	renderAll();
	Scenes[scene].ui();
	if(renderCols){
		RenderCols();
	}
	requestAnimationFrame(update);
	
	/*frChange += dt;
	
	if(frChange > 0.2){
		frChange = 0;
		frRate = (Math.ceil((1 / dt) / 2) * 2);
	}
	for(let i = 0; i < frRate.toString().length; i++){
		renderUi(-475 + i * 20, -275, 20, 20, numsImg[parseInt( (frRate.toString())[i] )]);
	}*/
	
	musicManager.update();
	
	for(let i = 0; i < PK.length; i++){
		PKLF[i] = PK[i];
	}
	
	for(let i = 0; i < MP.length; i++){
		MPLF[i] = MP[i];
	}
}

function RenderCols(){
	
	//let Size = canvas.width / 1000;
	let Size = SizeCanvas;
	let x;
	let y;
	let width;
	let height;
	
	for(let i = 0; i < Colliders.length; i++){
		
		x = -CamX + (500 * CamSize);
		y = -CamY + (300 * CamSize);
		
		x += Colliders[i].x;
		y += Colliders[i].y;
		
		x *= Size;
		y *= Size;
		
		width = Colliders[i].width / 2 * Size;
		height = Colliders[i].height / 2 * Size;
		
		ctx.beginPath();
		ctx.strokeStyle = '#0f0';
		ctx.moveTo(x - width, y - height);
		ctx.lineTo(x + width, y - height);
		ctx.moveTo(x - width, y + height);
		ctx.lineTo(x + width, y + height);
		ctx.moveTo(x - width, y - height);
		ctx.lineTo(x - width, y + height);
		ctx.moveTo(x + width, y - height);
		ctx.lineTo(x + width, y + height);
		ctx.stroke();
	}
}

function loadImages(){
	loadImg("UI/loadBar");
	loadImg("icon");
	loadImg("UI/buttons/BG");
	loadImg("BG");

	for(let i = 0; i < Alphabet.length; i++){
		if(Alphabet[i] != ' '){
			loadImg("Text/" + Alphabet[i]);
		}else{
			loadImg("Text/_");
		}
	}
	
	for(let i = 0; i < 10; i++){
		loadImg("Text/" + i);
	}
	
	loadingBar();
}

function loadingBar(){
	canvas.height = window.innerHeight - 2;
	canvas.width = canvas.height * 1.73;
	SizeCanvas = canvas.width / (1000 * CamSize);
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	let porc = (loaded / needed) * 400;
	renderUi(0, 0, porc + (porc / 2), 30, SprFind("UI/loadBar"));
	
	if(loaded < needed){
		requestAnimationFrame(loadingBar);
	}else{
		console.log("Image loading complete!");
		scene = 0;
		mainStart();
	}
}

function loadImg(idx){
	needed++;
	let id = imgs.length;
	let img = new Image();
	img.src = "./images/" + idx + ".png";
	
	imgs.push(img);
	
	imgs[id].onload = function(){
		loaded++;
	}
	return id;
}

function Clone(original){
	return Object.assign(Object.create(Object.getPrototypeOf(original)), original);
}

class MusicManger{
	constructor(musicStart){
		this.oldMusic = musicStart;
		music = musicStart;
		this.musicsNeeded = musics.length;

		for(let i = 0; i < musics.length; i++){
			let audio = loadSound("music/" + musics[i].src);
			audio.oncanplay = function(){musicManager.onLoadSound(audio)};
		}

		//this.aud = PlaySound(musics[musicStart].src);
		this.musicStart = musicStart;
		this.localOldTime = Date.now();
		this.dt = this.localOldTime - Date.now();
		this.timerOff = 1;
		this.timerOn = 0;
		this.timerMusic = 0;
		//pressed mouse once
		this.pmo = false;
		this.sideMusics = [];
		//this.addSideMusic(1);
	}

	addSideMusic(id, volume){
		for(let i = 0; i < this.sideMusics.length; i++){
			if(this.sideMusics[i].id == id){
				return false;
			}
		}

		let time = this.aud.currentTime - (Math.floor(this.aud.currentTime / musics[id].time) * musics[id].time);
		this.sideMusics.push({aud: null, id: id, time: time, remove: false, removeTimer: 1, volume: isNaN(volume) ? 1 : volume});

		return true;
	}

	removeSideMusic(id){
		for(let i = 0; i < this.sideMusics.length; i++){
			if(this.sideMusics[i].id == id){
				this.sideMusics[i].remove = true;
				break;
			}
		}
	}

	onLoadSound(audio){
		this.musicsNeeded--;
		if(this.musicsNeeded <= 0){
			for(let i = 0; i < musics.length; i++){
				musics[i].time = sounds[getSoundId("music/" + musics[i].src)][0].duration;
			}
			this.timerMusic = musics[this.musicStart].time;
		}
	}
	
	update(){
		this.dt = Date.now() - this.localOldTime;
		this.dt *= 0.001;
		let rate = musicSpeed * gameSpeed;

		if(rate < 0.1 && rate != 0){
			rate = 0.1;
		}
		if(rate > 10){
			rate = 10;
		}

		if(this.timerOff > 0){
			this.timerOff -= dt;
		}else{
			this.timerOff = 0;
		}

		for(let i = 0; i < MP.length; i++){
			if(MP[i] == 1){
				this.pmo = true;
			}
		}
		
		if(!this.pmo){
			return;
		}

		if(musics[music] == null){
			if(this.aud != null){
				this.aud.currentTime = 0;
				this.aud.pause();
				if(music == -1){
					music = this.oldMusic;
					this.oldMusic = -1;
					this.aud.currentTime = 0;
					this.timerMusic = 0;
					this.aud.currentTime = 0;
					this.aud.playbackRate = musicSpeed;
					this.timerOff = 1;
				}
			}
			return;
		}

		//this.timerMusic += this.dt * musicSpeed * gameSpeed;
		this.timerMusic += this.dt * rate;
		if(music != this.oldMusic){
			if(music >= 0 && this.oldMusic != -1){
				this.timerOn += this.dt * rate;
				if(this.timerOn >= 1){
					this.timerOn = 0
					this.oldMusic = music;
					if(this.aud != null){
						this.aud.pause();
					}
					this.timerMusic = musics[this.oldMusic].time;
				}
			}else if(this.oldMusic == -1){
				this.oldMusic = music;
				this.timerMusic = musics[this.oldMusic].time;
			}
		}
		
		let restarMusic = this.timerMusic >= musics[this.oldMusic].time;
		if(this.aud != null)
			this.timerMusic = this.aud.currentTime;

		if(restarMusic){
			this.timerMusic = 0;
			if(this.aud != null){this.aud.pause();}
			this.aud = PlaySound("music/" + musics[this.oldMusic].src, musicVolume * musics[music].myVolume);
			this.aud.currentTime = 0;
		}
		
		if(this.aud != null){
			let newVolume = (musicVolume * musics[this.oldMusic].myVolume * persistantData[1]) - this.timerOff - this.timerOn;

			if(newVolume > 1){
				newVolume = 1;
			}else if(newVolume < 0){
				newVolume = 0;
			}

			for(let elId = 0; elId < this.sideMusics.length; elId++){
				let element = this.sideMusics[elId];

				if(!element.remove && element.removeTimer > 0){
					element.removeTimer -= this.dt;
					if(element.removeTimer < 0){
						element.removeTimer = 0;
					}
				}else if(element.remove){
					element.removeTimer += this.dt;
					if(element.removeTimer >= 1){
						element.aud.pause();
						this.sideMusics.splice(elId, 1);
						elId--;
						continue;
					}
				}

				let volumeElement = ((musicVolume * musics[element.id].myVolume * persistantData[1]) * element.volume) - element.removeTimer;

				element.time += this.dt * rate;
				if(element.time >= musics[element.id].time){
					element.aud.pause();
					element.aud = null;
				}
				if(element.aud == null){
					element.time = this.timerMusic - (Math.floor(this.timerMusic / musics[element.id].time) * musics[element.id].time)
					element.aud = PlaySound("music/" + musics[element.id].src, 1);
					element.aud.currentTime = element.time;
				}else{
					element.aud.volume = volumeElement;
					element.aud.playbackRate = rate;
				}
			}

			this.aud.playbackRate = rate;
			
			this.aud.volume = newVolume;
		}
		
		this.localOldTime = Date.now();
	}
}

function loadSound(soundPath){
	sounds.push([]);
	for(let i = 0; i < soundRedundancy; i++){
		sounds[sounds.length - 1].push(new Audio("./sounds/" + soundPath));
	}
	soundsSrc.push(soundPath);
	soundsMult.push(0);
	needed++;

	sounds[sounds.length - 1][soundRedundancy - 1].oncanplay = function(){ loaded++; }

	return sounds[sounds.length - 1][0];
}

function getSoundId(soundPath){
	for(let i = 0; i < soundsSrc.length; i++){
		if(soundsSrc[i] == soundPath){
			return i;
		}
	}
	return 0;
}

var musicSpeed = 1;
var musicVolume = 1;
var music = 0;
var imgs = [];
var loaded = 0;
var needed = 0;
var player = null;
var numsImg = [];
const Alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', "'", '-', ';', ' ', '_'];
var lettersImg = [];
var sounds = [];
var soundsSrc = [];
var soundsMult = [];

//{src: "PATH", myVolume: 1, time: 0}
const musics = [
	{src: "thxCheese.mp3", myVolume: 1, time: 0},
	{src: "testCombo.mp3", myVolume: 1, time: 0}
];
const musicManager = new MusicManger(0);

var minimized = false;
var gameSpeed = 1;

document.addEventListener("visibilitychange", function() {
	if(document.hidden){
		minimized = true;
		musicManager.aud.playbackRate = 0;
		musicManager.sideMusics.forEach(element => {
			element.aud.playbackRate = 0;
		});
	}else{
		musicManager.localOldTime = Date.now();
		minimized = false;
	}
}, false);

window.onkeyup = function(e) { PK[e.keyCode] = 0; }
window.onkeydown = function(e) { PK[e.keyCode] = 1; }
	
window.onmouseup = function(e) { MP[e.button] = false}
window.onmousedown = function(e) { MP[e.button] = true}

loadImages();