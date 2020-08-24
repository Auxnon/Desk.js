/*

var screenWidth;
var screenHeight;
var cellWidth;
var cellHeight;
var canvas;
var cell=[];
var player={x:0,y:0,ix:0,iy:0};
var entities=[];
var scr;

var scaleTrigger=false;
var bubbleMenu=null;*/


const SNAP_DISTANCE=40;
var doubleTapSpeed=300; //300
var scaleSnapThreshold=100;

var targets=[];
var targetsHashed=[];
var double=false;
var multiDouble=0;

var blueprint;

//dev
var pressThrough=false;

const  SIZES=[ {w:86,h:86},{w:128,h:192},{w:512,h:256}]


function init(){
	let panes=document.querySelectorAll('.draggable');

	//applyPaneMods(panes);
	panes.forEach((e,i)=>{
		e.style.zIndex=i;
		e.style.left='0px'
		e.style.top='0px'
		applyPaneMods(e);
	});
	initClip();
	

	let main=document.querySelector("#main");
	main.addEventListener('pointerup',pointerUp);
	main.addEventListener('pointerdown',pointerDown);
	main.addEventListener('pointermove',pointerMove);
	main.addEventListener('contextmenu',mainContext);
	main.style.touchAction='none';

	/*window.addEventListener('mouseup',ev=>{
		if(targets.length){
			targets=[];
			targetsHashed=[];
		}
	})
	window.addEventListener('touchend',ev=>{
		if(ev.touches.length<=0 && targets.length>0){
			targets=[];
			targetsHashed=[];
		}
	})*/
	//initBluePrint(main,0,main.offsetHeight-128,64,128);

	//initExternal(main[0]);
	//initCopyPaste(main)

	//little ios fix to stop double tap zoom, and possibly other things we dont want in this library!
	/*if ('ongesturestart' in window){
		window.addEventListener('gesturestart',function(ev){
			ev.preventDefault();
		})
	}*/
	initButtonTest();
}$(init);
function initButtonTest(){
	document.querySelectorAll('.button').forEach((e,i)=>{
		e.addEventListener('pointerup',ev=>{
			console.log('hi'+e.innerText)
			e.parentElement.querySelector('p').innerText=e.innerText
			ev.stopPropagation();
		})
		e.addEventListener('pointerdown',ev=>{
			ev.stopPropagation();
		})
	})
}
	
function initBluePrint(main,x,y,w,h){
	blueprint=document.createElement('div');
	blueprint.className='blueprint';
	blueprint.style.width=w+'px';
	blueprint.style.height=h+'px';
	blueprint.style.left=x+'px';
	blueprint.style.top=y+'px';
	blueprint.style.display='block'
	main.appendChild(blueprint);
}
function moveBluePrint(x,y,w,h){
	blueprint
}

function doubleTapOne(pane){
		double=false;
		console.log('double!!!!');
		snapToScale(pane,true);
}
function pasteInto(entity){

	navigator.clipboard.readText()
	  .then(text => {
	    console.log('Pasted content: ', text);
	    entity.querySelector('p').innerText=text;
	  })
	  .catch(err => {
	    console.error('Failed to read clipboard contents: ', err);
	  });
}

function applyPaneMods(pane){
	pane.addEventListener('pointerdown',pointerDown);
	pane.addEventListener('contextmenu',paneContext);
	//pane.on("pointerdown",pointerDown).contextmenu(paneContext)
}


function pointerDown(ev){
	console.log('also')
	let entity=this;//ev.target;
	if(!entity.classList.contains('draggable'))
		return;
	let offsetX=parseInt(entity.style.left)-ev.clientX;
	let offsetY=parseInt(entity.style.top)-ev.clientY;
	
	let targetObj={entity:entity,
		x:ev.clientX,
		y:ev.clientY,
		parent:entity.parentElement,
		selected:[],
		offsetX:offsetX,
		offsetY:offsetY,
		w:entity.offsetWidth,
		h:entity.offsetHeight,
		double:true,
		pid:ev.pointerId};

	let multiObject=false;
	if(entity.classList.contains('dragging')){
		for(let i=0;i<targets.length;i++){
			if(targets[i].entity && targets[i].entity==entity){
				multiObject=targets[i];
			}
		}
	}

	if(multiObject){ //multiple figners on the same object logic follows

		if(!multiObject.linked){
			multiObject.linked={w:0,h:0,offsetX:0,offsetY:0,array:[]};
			multiObject.linked.array.push(multiObject)
		}
		multiObject.linked.array.push(targetObj);
		targetObj.linked=multiObject.linked;

		//set the initial dimensions of these multiple points for calculating scale
		let sx,sy,lowest={x:0,y:0},offset={x:0,y:0};
		targetObj.linked.array.forEach((ent,i)=>{
		 	if(!sx){
		 		sx=ent.x//+ent.offsetX;
		 		lowest.x=ent.x;
		 		offset.x=ent.offsetX;
		 	}else{
		 		sx-=ent.x//+ent.offsetX;
		 		if(ent.x<lowest.x){
		 			lowest.x=ent.x;
		 			offset.x=ent.offsetX;
		 		}
		 	}
		 	if(!sy){
		 		sy=ent.y//+ent.offsetY;
		 		lowest.y=ent.y;
		 		offset.y=ent.offsetY;
		 	}else{
		 		sy-=ent.y//+ent.offsetY;
		 		if(ent.y<lowest.y){
		 			lowest.y=ent.y;
		 			offset.y=ent.offsetY;
		 		}
		 	}
		});
		targetObj.linked.w=Math.abs(sx);
		targetObj.linked.h=Math.abs(sy);
		targetObj.linked.offsetX=offset.x;
		targetObj.linked.offsetY=offset.y;
		targetObj.linked.lowestX=lowest.x;
		targetObj.linked.lowestY=lowest.y;

	
		
	} else { //singular finger logic follows
		entity.classList.add("dragging")
		entity.classList.remove("selected");

		if(pressThrough){
			let hits=[];
			$('.draggable').not(entity).each((i,ee)=>{
				let ent=$(ee);
				if(e.clientX > ent.position().left && e.clientX<ent.position().left+ent.outerWidth()){
					if(e.clientY > ent.position().top && e.clientY<ent.position().top+ent.outerHeight()){
						let obj={x:-e.clientX+ent.position().left,y:-e.clientY+ent.position().top,entity:ent,w:ent.outerWidth(),h:ent.outerHeight()};
						hits.push(obj);
					}
				}
			});
			targetObj.selected=hits;
		}

		let z=parseInt(entity.style.zIndex);
		let draggables=document.querySelectorAll('.draggable');
		draggables.forEach((e,i)=>{
			let zEnt=parseInt(e.style.zIndex);
			if(zEnt>z){
				e.style.zIndex=--zEnt;
			}
		});
		entity.style.zIndex=draggables.length-1;
	}

	//===double tap management===
	if(double){
		if(entity==double){
			if(multiDouble>1 ){
				if(targetObj.linked && targetObj.linked.array.length>1){
					console.log('multidouble!!!! '+multiDouble);
					double=false;
					if(entity.style.width=='100%'){
						//entity.css({transition:'0.2s',left:targetObj.linked.lowestX-40,top:targetObj.linked.lowestY-40,width:(targetObj.linked.w+80)+'px',height:(targetObj.linked.h+80)+'px'});
						setTimeout(function(){entity.css('transition','');},200);
					}else{
						//entity.css({transition:'0.2s',left:0,top:0,width:'100%',height:'100%'});
						//setTimeout(function(){entity.css('transition','');},200);
					}
				}
			}else{
				doubleTapOne(entity);
			}
		}
	}
	setTimeout(function(){
		targetObj.double=false;
	},doubleTapSpeed);
	//============================
	


	targets.push(targetObj);
	targetsHashed[targetObj.pid]=targetObj;
	ev.stopPropagation();
}	

var clipPoints
function clipCycle() {
	let st=""
	if(targets.length>0){
		let draggables=document.querySelectorAll('.draggable');
		clipPoints=[];
		

		targets.forEach(t=>{
			draggables.forEach(d=>{
				if(t.entity!=d){
					let x1=parseInt(t.entity.style.left)
					let y1=parseInt(t.entity.style.top)
					let w1=parseInt(t.entity.offsetWidth)
					let h1=parseInt(t.entity.offsetHeight)
					let x2=parseInt(d.style.left)
					let y2=parseInt(d.style.top)
					let w2=d.offsetWidth
					let h2=d.offsetHeight

					let xw1=x1+w1
					let xw2=x2+w2
					let yh1=y1+h1
					let yh2=y2+h2

					//
					//

					let sx=Math.max(x2,xw2)
					let ex=Math.min(x2,xw2)

					let sy=Math.max(y2,yh2)
					let ey=Math.min(y2,yh2)
					if( x1<sx && xw1>ex){          // && x2<(x1+w1) ) || ((x2+w2)>x1 && (x2+w2)< (x1+w1) )){
						let mx1=Math.max(x1,x2)
						let mx2=Math.min(xw1,xw2)

						let dy=(y2+h2/2)-(y1+h1/2)
						let midY
						let distance
						let value
						if(dy>0){
							distance=(yh1-y2)
							value=y2-h1
							midY=yh1-distance/2
						}else{
							distance=(yh2-y1)
							value=yh2
							midY=yh2-distance/2
						}
						if(Math.abs(distance)<SNAP_DISTANCE){
							st+=makeLine(mx1,midY,mx2,midY)
							clipPoints.push({drag:t.entity,target:d,mode:1,value:value})
						}
						
					}else if(y1<sy && yh1>ey){
						
						let my1=Math.max(y1,y2)
						let my2=Math.min(yh1,yh2)

						let dx=(x2+w2/2)-(x1+w1/2)
						let midX
						let distance
						let value
						if(dx>0){
							distance=(xw1-x2)
							value=x2-w1
							midX=xw1-distance/2
						}else{
							distance=(xw2-x1)
							value=xw2
							midX=xw2-distance/2
						}
						if(Math.abs(distance)<SNAP_DISTANCE){
							st+=makeLine(midX,my1,midX,my2)
							clipPoints.push({drag:t.entity,target:d,mode:0,value:value})
						}
					}

					
					
				}
			})
		});
		
	}else{
		if(clipPoints){
			clipPoints.forEach(c=>{
				if(c.mode==0)
					c.drag.style.left=c.value+'px'
				else
					c.drag.style.top=c.value+'px'
			})
		}
		clipPoints=undefined;
	}
	path.setAttribute('d',st)
}
var svg
var path
function initClip(){
	svg=document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.style.position='absolute'
	svg.style.left=0
	svg.style.pointerEvents='none'
	svg.style.top=0
	svg.setAttribute('width',1024)
	svg.setAttribute('height',1024)
	svg.setAttribute('stroke','white');
	svg.setAttribute('stroke-width','3');
	svg.setAttribute('stroke-dasharray','8 4')
	path=document.createElementNS("http://www.w3.org/2000/svg", "path");
	path.setAttribute('d',"M0 0L 512 512")
	svg.appendChild(path);
	main.appendChild(svg);
	setInterval(clipCycle,100)
}
function makeLine(x1,y1,x2,y2){
	let st="M "+parseInt(x1)+" "+parseInt(y1)+"L"+parseInt(x2)+" "+parseInt(y2);
	return st;
}

function pointerMove(ev){
	gestureMove(ev,ev.pointerId);
}
function gestureMove(ev,id){

	if(targets.length){
		let targetObj=targetsHashed[ev.pointerId];
		if(targetObj && targetObj.entity){
			let entity=targetObj.entity;
			let pw=targetObj.parent.offsetWidth;
			let ph=targetObj.parent.offsetHeight;
			//sanity management, purge pointers that leave the screen
			if(ev.clientX>pw || ev.clientX<0 || ev.clientY>ph || ev.clientY<0){
				console.log('early pointer purge');
				pointerPurge(ev.pointerId);
				return;
			}
			let maxW=pw-entity.offsetWidth;
			let maxH=ph-entity.offsetHeight;
			
			let left=ev.clientX+targetObj.offsetX;
			let top=ev.clientY+targetObj.offsetY;

			if(left>maxW)
				left=maxW;
			if(left<0)
				left=0;
			if(top>maxH)
				top=maxH;
			if(top<0)
				top=0;

			if(targetObj.linked && targetObj.linked.array.length>1){
				targetObj.x=ev.clientX;
				targetObj.y=ev.clientY;

				//doing some absolutely wild logic here so please bare with me!
				let lowest={x:0,y:0};
				let offset={x:0,y:0};

				let highestX={x:-99999999};
				let highestY={y:-99999999};

				let sx,sy;

				targetObj.linked.array.forEach((ent,i)=>{
				 	if(!sx){
				 		sx=ent.x//+ent.offsetX;
				 		lowest.x=ent.x;
				 		offset.x=ent.offsetX;
				 	}else{
				 		sx-=ent.x//+ent.offsetX;
				 		if(ent.x<lowest.x){
				 			lowest.x=ent.x;
				 			offset.x=ent.offsetX;
				 		}
				 	}
				 	if(!sy){
				 		sy=ent.y//+ent.offsetY;
				 		lowest.y=ent.y;
				 		offset.y=ent.offsetY;
				 	}else{
				 		sy-=ent.y//+ent.offsetY;
				 		if(ent.y<lowest.y){
				 			lowest.y=ent.y;
				 			offset.y=ent.offsetY;
				 		}
				 	}
				 	/*if(ent.x+ent.offsetX<lowestX.x){
				 		lowestX=ent;
				 	}
				 	if(ent.y+ent.offsetY<lowestY.y){
				 		lowestY=ent;
				 	}
				 	if(ent.x>highestX.x){
				 		highestX=ent;
				 	}
				 	if(ent.y>highestY.y){
				 		highestY=ent;
				 	}*/
				 	//draw(ent.x,ent.y-20,"h"+ent.offsetX);
				 	//draw(ent.x,ent.y);
				});
				lowest.x+=targetObj.linked.offsetX;
				lowest.y+=targetObj.linked.offsetY;
				

				let spanX=targetObj.linked.w -Math.abs(sx);
				let spanY=targetObj.linked.h -Math.abs(sy);
				let span=Math.sqrt(spanX*spanX + spanY*spanY);
				
				//if(span>25 || scaleTrigger){
					scaleTrigger=true;
					let w=targetObj.linked.array[0].w-spanX;
					let h=targetObj.linked.array[0].h-spanY;

					entity.style.left=lowest.x+"px";
					entity.style.top=lowest.y+"px";
					entity.style.width=w+"px";
					entity.style.height=h+"px";
				//}
			}else{
				entity.style.left=left+"px";
				entity.style.top=top+"px";

				targetObj.x=ev.clientX;
				targetObj.y=ev.clientY;
				left-=targetObj.offsetX;
				top-=targetObj.offsetY;
				if(targetObj.selected){
					targetObj.selected.forEach((obj,i)=>{
						let L=left+obj.x;
						let T=top+obj.y;
						let mL=pw-obj.w;
						let mT=ph-obj.h;
						if(L>mL)
							L=mL;
						if(L<0)
							L=0;
						if(T>mT)
							T=mT;
						if(T<0)
							T=0;
						obj.entity.style.left=L+'px';
						obj.entity.style.top=T+'px';
					});
				}
				/*if(vacuumMode){
					$(".pane").not(entity).not('.selected').each(function(index){
						let el=$(this);
						let x=entity.position().left-el.position().left;
						let y=entity.position().top-el.position().top;
						if(Math.sqrt(x*x +y*y)<80){
							el.addClass("selected");
							//el.css('--time',((selected.length+1)*0.02)+'s');
							selected.push(el);
						}else{
							el.removeClass("selected");
						}
						
					});
					selected.forEach(function(e,i){
						let offset=5*(i+1);
						e.css({left:left+offset+"px",top:top+offset+"px"});
					});
				}*/


			}

		}
		/*if(bubbleMenu && bubbleMenu.pid==e.pointerId){
			moveBubbleSelector(e.clientX,e.clientY);
		}*/
	}

	
}

function pointerUp(ev){
	scaleTrigger=false;

	/*if(selected.length>0){
		let group=$('<div class="group draggable"></div>');
		selected.push(target);
		selected.forEach(function(e,i){
			group.append(e);
		});
		 
		group.on("pointerdown",down).contextmenu(context);
		$('.desktop').append(group);
	}*/
	pointerPurge(ev.pointerId);
}
function pointerPurge(id){
	let targetObj=targetsHashed[id];
	if(targetObj){
		//for linked pointers, scrub their own references from the shared linked list
		if(targetObj.linked){
			for(let i=0;i<targetObj.linked.length;i++){
				if(targetObj.linked.array[i].pid==id){
					//matched, dump it
					targetObj.linked.array.splice(i,1);
				}
			}
			if(targetObj.linked.array.length<=1){ //this means there's one to no fingers left so let's bake in our width if we had scaled
				targetObj.linked.array[0].w=targetObj.entity.offsetWidth;
				targetObj.linked.array[0].h=targetObj.entity.offsetHeight;
				targetObj.linked.array[0].offsetX=parseInt(targetObj.entity.style.left)-targetObj.linked.array[0].x;
				targetObj.linked.array[0].offsetY=parseInt(targetObj.entity.style.top)-targetObj.linked.array[0].y;
				targetObj.linked.array[0].linked=null;
				console.log('solo pointer')
			}
		}else if(targetObj.entity){ //if a singular pointer, do some trivial nonsense
			targetObj.entity.classList.remove("dragging","selected");
		}

		//take care of some double click logic
		if(targetsHashed[id].double){
			double=targetsHashed[id].entity;
			if(targetsHashed[id].linked){
				multiDouble=targetsHashed[id].linked.array.length;
			}
			setTimeout(function(){
				double=false;
				multiDouble=0;
			},doubleTapSpeed);
		}
		
		//finally wipe the pointer reference itself from our main pointer hash list
		targetsHashed[id]=null;
		//targetsHashed.splice(id,1);
		//and now purge from our unordered list
		for(let i=0;i<targets.length;i++){
			if(targets[i].pid==id){
				targets.splice(i,1);
				break;
			}
		}

		snapToScale(targetObj.entity);
	}
	/*if(bubbleMenu && bubbleMenu.pid==id){
		stopBubbleMenu();
	}*/
}
function mainContext(e){
	e.preventDefault();
	
}
function mainDown(e){
	$('.selectBubble').show();

	if(!bubbleMenu){
	let targetObj={entity:null,
		x:e.clientX,
		y:e.clientY,
		/*parent:null,
		selected:[],
		offsetX:offsetX,
		offsetY:offsetY,
		w:entity.outerWidth(),
		h:entity.outerHeight(),
		double:true,*/
		pid:e.pointerId};
	targets.push(targetObj);
	targetsHashed[targetObj.pid]=targetObj;

	let bubbles=$('.bubble');
	let radial=2*Math.PI/bubbles.length;

	bubbles.removeClass('hideBubble');
	bubbles.each((i,ee)=>{
		let ent=$(ee);
		let xx=e.clientX+Math.sin(radial*i)*50;
		let yy=e.clientY-Math.cos(radial*i)*50;
		ent.css({left:xx+'px',top:yy+'px'})
	});


	bubbleMenu=targetObj;

	moveBubbleSelector(e.clientX,e.clientY);
	
	}
}

//process through clipped sizes to a match
function snapToScale(entity,advanceSize){
	let w=entity.offsetWidth;
	let h=entity.offsetHeight; 
	let best=-1;

	let close=9999999;//,closeY=9999999;
	let perfect=-1;


	SIZES.forEach((o,i)=>{
			let dx=Math.abs(o.w-w)
			let dy=Math.abs(o.h-h)
			if(advanceSize && dx==0 && dy==0)
				perfect=i;
			if((dx+dy)<close && (advanceSize || (dx+dy)<scaleSnapThreshold) ){
				best=i;
				close=dx+dy;
			}
	});
	let setSize;
	if(advanceSize && perfect>=0){
		if(perfect+1>=SIZES.length)
			perfect=-1
		let targetSize=SIZES[perfect+1];
		let dx=(w-targetSize.w)/2;
		let dy=(h-targetSize.h)/2;
		setSize=[(parseInt(entity.style.left)+dx),(parseInt(entity.style.top)+dy),targetSize.w,targetSize.h]
	}else{
		if(best>=0){
			let dx=(w-SIZES[best].w)/2;
			let dy=(h-SIZES[best].h)/2;
			setSize=[(parseInt(entity.style.left)+dx),(parseInt(entity.style.top)+dy),SIZES[best].w,SIZES[best].h]
		}
	}

	if(setSize){
		if(setSize[2]>window.innerWidth){
			entity.style.width='100%'
			entity.style.left='50%'
		}else{
			entity.style.left=setSize[0]+'px'
			entity.style.width=setSize[2]+'px'
		}

		entity.style.top=setSize[1]+'px'
		entity.style.height=setSize[3]+'px'
	}
	
}











/////////////////////////EXTRA///////////////////////////////




/*
function OLDpointerDown(e){
	let entity=$(this);
	let offsetX=entity.position().left-e.clientX;
	let offsetY=entity.position().top-e.clientY;
	
	let targetObj={entity:entity,
		x:e.clientX,
		y:e.clientY,
		parent:entity.parent(),
		selected:[],
		offsetX:offsetX,
		offsetY:offsetY,
		w:entity.outerWidth(),
		h:entity.outerHeight(),
		double:true,
		pid:e.pointerId};

	let multiObject=false;
	if(entity.hasClass('dragging')){
		for(let i=0;i<targets.length;i++){
			if(targets[i].entity && targets[i].entity.is(entity)){
				multiObject=targets[i];
			}
		}
	}

	if(multiObject){ //multiple figners on the same object logic follows

		if(!multiObject.linked){
			multiObject.linked={w:0,h:0,offsetX:0,offsetY:0,array:[]};
			multiObject.linked.array.push(multiObject)
		}
		multiObject.linked.array.push(targetObj);
		targetObj.linked=multiObject.linked;

		//set the initial dimensions of these multiple points for calculating scale
		let sx,sy,lowest={x:0,y:0},offset={x:0,y:0};
		targetObj.linked.array.forEach((ent,i)=>{
		 	if(!sx){
		 		sx=ent.x//+ent.offsetX;
		 		lowest.x=ent.x;
		 		offset.x=ent.offsetX;
		 	}else{
		 		sx-=ent.x//+ent.offsetX;
		 		if(ent.x<lowest.x){
		 			lowest.x=ent.x;
		 			offset.x=ent.offsetX;
		 		}
		 	}
		 	if(!sy){
		 		sy=ent.y//+ent.offsetY;
		 		lowest.y=ent.y;
		 		offset.y=ent.offsetY;
		 	}else{
		 		sy-=ent.y//+ent.offsetY;
		 		if(ent.y<lowest.y){
		 			lowest.y=ent.y;
		 			offset.y=ent.offsetY;
		 		}
		 	}
		});
		targetObj.linked.w=Math.abs(sx);
		targetObj.linked.h=Math.abs(sy);
		targetObj.linked.offsetX=offset.x;
		targetObj.linked.offsetY=offset.y;
		targetObj.linked.lowestX=lowest.x;
		targetObj.linked.lowestY=lowest.y;

	
		
	} else { //singular finger logic follows
		entity.addClass("dragging").removeClass("selected");

		if(pressThrough){
			let hits=[];
			$('.draggable').not(entity).each((i,ee)=>{
				let ent=$(ee);
				if(e.clientX > ent.position().left && e.clientX<ent.position().left+ent.outerWidth()){
					if(e.clientY > ent.position().top && e.clientY<ent.position().top+ent.outerHeight()){
						let obj={x:-e.clientX+ent.position().left,y:-e.clientY+ent.position().top,entity:ent,w:ent.outerWidth(),h:ent.outerHeight()};
						hits.push(obj);
					}
				}
			});
			targetObj.selected=hits;
		}

		let z=parseInt(entity.css('z-index'));
		let draggables=$('.draggable');
		draggables.each(function(i,ee){
			let ent=$(this);
			let zEnt=parseInt(ent.css('z-index'));
			if(zEnt>z){
				ent.css('z-index',--zEnt);
			}
		});
		entity.css('z-index',draggables.length-1);
	}

	//===double tap management===
	if(double){
		if(entity.is(double)){
			if(multiDouble>1 ){
				if(targetObj.linked && targetObj.linked.array.length>1){
					console.log('multidouble!!!! '+multiDouble);
					double=false;
					if(entity[0].style.width=='100%'){
						entity.css({transition:'0.2s',left:targetObj.linked.lowestX-40,top:targetObj.linked.lowestY-40,width:(targetObj.linked.w+80)+'px',height:(targetObj.linked.h+80)+'px'});
						setTimeout(function(){entity.css('transition','');},200);
					}else{
						entity.css({transition:'0.2s',left:0,top:0,width:'100%',height:'100%'});
						setTimeout(function(){entity.css('transition','');},200);
					}
				}
			}else{
				double=false;
				console.log('double!!!!');
				navigator.clipboard.readText()
				  .then(text => {
				    console.log('Pasted content: ', text);
				    entity.find('p').html(text);
				  })
				  .catch(err => {
				    console.error('Failed to read clipboard contents: ', err);
				  });
			}
		}
	}
	setTimeout(function(){
		targetObj.double=false;
	},doubleTapSpeed);
	//============================
	


	targets.push(targetObj);
	targetsHashed[targetObj.pid]=targetObj;
	e.stopPropagation();
}	*/
/*//annoying polyfills until Safari (at least for iPads) supports pointer events
function touchMove(e){
	gestureMove(e,)
}*/


function stopBubbleMenu(){
	let main=$("#main");
	$('.bubble').addClass('hideBubble');//.css({left:main.outerWidth()/2,top:main.outerHeight()*1.5});
	let select=$('.selectBubble');
	if(select){
		select.hide();
		let text=select.children().html();
		if(text){
			if(text=='paste'){
				paste();
			}
		}
	}
	bubbleMenu=null;
}
function moveBubbleSelector(x,y){
	let xx=x;
	let yy=y;
	$('.selectBubble').css({left:xx+'px',top:yy+'px'});
	let dx=x-bubbleMenu.x;
	let dy=y-bubbleMenu.y;
	let dr=Math.sqrt(dx*dx + dy*dy);
	let R=angle(dx,dy);
	

	let bubbles=$('.bubble')
	bubbles.css('border','');
	let radial=2*Math.PI/bubbles.length;
	let tt=R/radial +radial/2;
	let index=Math.floor(tt);
	if(index>=bubbles.length)index=0;

	bubbles.eq(index).css('border','solid blue 6px');
	let text=bubbles.eq(index).attr('value');
	console.log(text);
	if(text){
		$('.selectBubble').children().html(text);
	}
	if(dr>200){
		stopBubbleMenu();
	}
}

function angle(dx,dy) {
  let theta = Math.atan2(dx, -dy); // range (-PI, PI]
  //theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
  if (theta < 0) theta = Math.PI*2 + theta; // range [0, 360)
  return theta;
}
function pasteEvent(e){
	let type=e.originalEvent.clipboardData.types[0];
	if(type=='text/plain'){
		let text=e.originalEvent.clipboardData.getData('text/plain');
		console.log('pasted '+text)
	}
}

function paste(){
	navigator.clipboard.read().then(text => {
    	console.log('Pasted content: ', text);
  	}).catch(err => {
    	console.error('Failed to read clipboard contents: ', err);
  	});
}
function addImg(img){
	let div=$('<div class="pane draggable"></div>');
	let z=$('.pane').length;
	div.css({left:e.clientX+'px',top:e.clientY+'px','z-index':z});
 	div.append('<img src="'+img+'" draggable=false/>');
 	applyPaneMods(div);
 	$(".desktop").append(div);
}

function paneContext(e){
	e.preventDefault();
	e.stopPropagation();
	//vacuumMode=true;
	//$(this).addClass('vacuum');
	console.log('context for pane')
}

var cycleDraw=0;
function draw(x,y,str){
	let all=$('.circle');
	if(all.length<10){
		for(let i=0;i<10;i++){
			let v=$('<div class="circle"></div>');
			$('#main').append(v);
			v.hide();
		}
		all=$('.circle');
	}
	let en=all.eq(cycleDraw);
	cycleDraw++;
	if(cycleDraw>all.length-1)
		cycleDraw=0;
	if(en){
		en.show();
		en.css({left:x,top:y});
		if(str){
			en.html(str);
		}
		setTimeout(function(){
			en.hide();
		},1000)
	}
} 



///CopyPaste
function initCopyPaste(main){
	main.on('paste',pasteEvent)
}

/////////EXTERNAL///////////
////////////////

function initExternal(target){
	target.addEventListener("drop",dropItem);
	target.addEventListener("dragover",dragItemOver);
}

function dropItem(e){
	e.preventDefault();
	e.stopPropagation();
	var data = e.dataTransfer.getData("text");
	console.log('dropped '+data)

	let file=e.dataTransfer.files[0];
	var fileReader = new FileReader();
    fileReader.onload = (function(file) {
       return function(e) {
       		addImg(e.target.result);
       };
    })(file);
	fileReader.readAsDataURL(file);
}
function dragItemOver(e){
	e.stopPropagation();
	e.preventDefault();
	e.dataTransfer.dropEffect='copy'
}

