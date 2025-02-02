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
	
	let letId = 0;
	let nw;
	let nh;
	let imgFind;
	
	for(let i = 0; i < numstring.length; i++){
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
			delete this.par;
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
		this.enabled = true;
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
		if(!this.enabled){
			return;
		}
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
		
		if(this.brightness + this.ghost != 2){
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
		
		ctx.drawImage(this.img, Math.floor(-halfX * SizeCanvas * this.OfX), Math.floor(-halfY * SizeCanvas * this.OfY),
		Math.floor(this.nWidth * SizeCanvas), Math.floor(this.nHeight * SizeCanvas));
		
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
		this.t = 0;
		this.p = false;
		this.callback = callBack;
	}
	
	update(){
		if(this.col.CheckForCollisions('mouse', true) != null){
			if(!MPLF[0] && MP[0]){
				this.p = true;
			}
			if(MPLF[0] && this.p){
				this.callback.onClick(this.buttonId);
				this.p = false;
			}
		}else{
			if(!MP[0]){
				this.p = false;
			}
		}
		addDrawRequest(this, 5000);
	}
	
	draw(){
		this.t += dt;
		renderUi(this.position.x + (Math.cos(this.t * 0.2) * this.width / 15), this.position.y + (Math.sin(this.t * 0.38) * this.width / 15), this.width, this.height, this.imgIdx);
	}
	
	destroy(){
		deleteCollider(this.col.id);
	}
}

class MenuScene{
	constructor(){
		
	}
	
	start(){
		new Button(0, 0, 50, 50, 'Pause', 0, this);
		CamX = 0;
		CamY = 0;
		gameSpeed = 1;
	}
	
	onClick(buttonId){
		if(buttonId == 0){
			scene = 1;
		}
	}
	
	update(){

	}
	
	ui(){
		
	}
}

class GameScene{
	constructor(){
		
	}
	
	start(){
		this.simSpeed = 4;
		new Button(-450, -250, 50, 50, 'Pause', 0, this);
		new Button(-375, -250, 50, 50, 'Resume', 1, this);
		this.cells = [this.newCell(0, 0), this.newCell(0, 1), this.newCell(0, -1)];
		this.nextCells = [];
		this.killCells = [];
		this.delay = 0;
		let clickX = 0;
		let clickY = 0;
		gameSpeed = 4.5;
	}
	
	newCell(x1, y1){
		return {x: x1, y: y1};
	}
	
	onClick(buttonClicked){
		if(buttonClicked == 0){
			this.simSpeed = 0;
		}else if(buttonClicked == 1){
			this.simSpeed = gameSpeed;
		}
	}
	
	getNearPosition(x, y){
		let nearMe = 0;
		for(let i = 0; i < this.cells.length; i++){
			if(!(this.cells[i].x == x && this.cells[i].y == y)){
				if(this.cells[i].x == x - 1 || this.cells[i].x == x + 1 || this.cells[i].x == x){
					if(this.cells[i].y == y - 1 || this.cells[i].y == y + 1 || this.cells[i].y == y){
						nearMe++;
					}
				}
			}
		}
		
		return nearMe;
	}
	
	hasThere(x, y){
		for(let i = 0; i < this.cells.length; i++){
			if(x == this.cells[i].x && y == this.cells[i].y){
				return true;
			}
		}
		return false;
	}
	
	getThere(x, y){
		for(let i = 0; i < this.cells.length; i++){
			if(x == this.cells[i].x && y == this.cells[i].y){
				return this.cells[i];
			}
		}
		return null;
	}
	
	willBeThere(x, y){
		for(let i = 0; i < this.nextCells.length; i++){
			if(x == this.nextCells[i].x && y == this.nextCells[i].y){
				return true;
			}
		}
		return false;
	}
	
	simulateCell(cell, pos){
		let nearMe = this.getNearPosition(cell.x, cell.y);
		
		for(let x = -1 ; x < 2; x++){
			for(let y = -1; y < 2; y++){
				if(!this.hasThere(cell.x + x, cell.y + y)){
					let nearThis = this.getNearPosition(cell.x + x, cell.y + y);
					if((!this.willBeThere(cell.x + x, cell.y + y) && nearThis == 3)){
						this.nextCells.push({x: cell.x + x, y: cell.y + y});
					}
				}
			}
		}
		
		if(nearMe < 2 || nearMe > 3){
			this.killCells.push(cell);
		}
	}
	
	update(){
		CamX += (PK[68] - PK[65]) * -400 * dt;
		CamY += (PK[83] - PK[87]) * -400 * dt;
		this.delay += dt * this.simSpeed;
		
		if(this.delay >= 1){
			this.delay--;
			for(let i = 0; i < this.cells.length; i++){
				this.simulateCell(this.cells[i], i);
			}
			
			let AAA = this.nextCells.length;
			for(let i = 0; i < AAA; i++){
				this.cells.push(Clone(this.nextCells[0]));
				this.nextCells.splice(0, 1);
			}
			
			let AAAAA = this.killCells.length;
			for(let i = 0; i < AAAAA; i++){
				for(let a = 0; a < this.cells.length; a++){
					if(this.cells[a] == this.killCells[0]){
						this.cells.splice(a, 1);
						this.killCells.splice(0, 1);
						i--;
					}
				}
			}
		}else{
			let xDif = (450 + CamX) * CamSize;
			let yDif = (250 + CamY) * CamSize;
			if(MP[0] && !MPLF[0]){
				this.clickX = this.GetPosInAx((mouse.x * CamSize) - xDif);
				this.clickY = this.GetPosInAx((mouse.y * CamSize) - yDif);
			}
			if(!MP[0] && MPLF[0] && mouse.col.CheckForCollisions("button", true) == null){
				if(this.GetPosInAx((mouse.x * CamSize) - xDif) == this.clickX && this.GetPosInAx((mouse.y * CamSize) - yDif) == this.clickY){
					if(!this.hasThere(this.clickX, this.clickY)){
						this.cells.push(this.newCell(this.clickX, this.clickY));
					}else{
						this.killCells.push(this.getThere(this.clickX, this.clickY));
						let AAAAA = this.killCells.length;
						for(let i = 0; i < AAAAA; i++){
								for(let a = 0; a < this.cells.length; a++){
									if(this.cells[a] == this.killCells[0]){
										this.cells.splice(a, 1);
										this.killCells.splice(0, 1);
										i--;
									}
							}
						}
					}
				}
			}
		}
	}
	
	GetPosInAx(pos){
		let mult = 1;
		if(pos < 0){
			mult = -1;
		}
		
		if(mult == -1){
			return Math.ceil(Math.abs(pos) / 50) * mult;
		}else{
			return Math.floor(Math.abs(pos) / 50) * mult;
		}
	}
	
	ui(){
		for(let x = -1; x < Math.ceil(39 * CamSize); x++){
			for(let y = 0; y < Math.ceil(11 * CamSize); y++){
				ctx.beginPath();
				ctx.strokeStyle = '#f0f';
				let cx = ((CamX / CamSize) - (Math.floor(CamX / 50 / CamSize) * 50));
				let cy = ((CamY / CamSize) - (Math.floor(CamY / 50 / CamSize) * 50));
				ctx.moveTo(((x * 50) + cx) * (canvas.width / 1000) / CamSize, ((y - 6) * 50 + cy) * (canvas.width / 1000) / CamSize);
				ctx.lineTo(((x * 50) + cx) * (canvas.width / 1000) / CamSize, ((y - 6) * 50 + 1200 + cy) * (canvas.width / 1000) / CamSize);
				ctx.stroke();
				
				for(let i = 0; i < 2; i++){
					ctx.beginPath();
					ctx.strokeStyle = '#f0f';
					ctx.moveTo((x * 50 + cx) * (canvas.width / 1000) / CamSize, (((y * 2) + i) * 50 + cy) * (canvas.width / 1000) / CamSize);
					ctx.lineTo(((x * 50) + cx + 2000) * (canvas.width / 1000) / CamSize, (((y * 2) + i) * 50 + cy) * (canvas.width / 1000) / CamSize);
					ctx.stroke();
				}
			}
		}
		
		for(let i = 0; i < this.cells.length; i++){
			renderUi((this.cells[i].x * 50 / CamSize) - (25 / CamSize) + (CamX / CamSize), (this.cells[i].y * 50 - 25 + CamY) / CamSize, 45 / CamSize, 45 / CamSize, SprFind("UI/buttons/BG"));
		}
	}
	
}

class Player extends obj{
	constructor(x, y, width, height){
		super(x, y, width, height);
	}
	
	update(){

	}
	
	draw(){

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
	delete Objects[idx];
	Objects.splice(idx, 1);
	for(let i = idx; i < Objects.length; i++){
		Objects[i].id--;
	}
}

function deleteCollider(idx){
	if(Colliders[idx].par != null){
		delete Colliders[idx].par;
	}
	delete Colliders[idx];
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
		audio.volume = 1;
	}else{
		audio.volume = volumeAmm;
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
	//RenderCols();
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
	loadImg("BG");
	
	loadImg("UI/buttons/Pause");
	loadImg("UI/buttons/Resume");
	loadImg("UI/buttons/BG");
	
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
		//this.aud = PlaySound(musics[musicStart].src);
		
		this.localOldTime = Date.now();
		this.dt = this.localOldTime - Date.now();
		this.timerOff = 0;
		this.timerOn = 0;
		if(musics[musicStart] == null){
			this.timerMusic = 0;
			return;
		}
		this.timerMusic = musics[musicStart].time;
		//pressed mouse once
		this.pmo = false;
	}
	
	update(){
		for(let i = 0; i < MP.length; i++){
			if(MP[i] == 1){
				this.pmo = true;
			}
		}
		
		if(musics[music] == null){
			return;
		}
		
		if(!this.pmo){
			return;
		}
		this.dt = Date.now() - this.localOldTime;
		this.dt *= 0.001;
		this.timerMusic += this.dt;
		if(music != this.oldMusic){
			this.oldMusic = music;
			if(this.aud != null){
				this.aud.volume = 0;
				delete this.aud;
			}
			this.timerMusic = musics[music].time;
		}
		
		if(this.timerMusic >= musics[this.oldMusic].time){
			this.timerMusic = 0;
			this.aud = PlaySound(musics[this.oldMusic].src);
		}
		this.localOldTime = Date.now();
	}
}

function loadSound(soundPath){
	sounds.push([new Audio("./sounds/" + soundPath), new Audio("./sounds/" + soundPath), new Audio("./sounds/" + soundPath), new Audio("./sounds/" + soundPath)]);
	soundsSrc.push(soundPath);
	soundsMult.push(0);
}

function getSoundId(soundPath){
	for(let i = 0; i < soundsSrc.length; i++){
		if(soundsSrc[i] == soundPath){
			return i;
		}
	}
	return 0;
}

//{src: "PATH", time: 1}
const musics = [];
const musicManager = new MusicManger(0);

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

var gameSpeed = 1;

window.onkeyup = function(e) { PK[e.keyCode] = 0; }
window.onkeydown = function(e) { PK[e.keyCode] = 1; }
	
window.onmouseup = function(e) { MP[e.button] = false}
window.onmousedown = function(e) { MP[e.button] = true}

loadImages();
