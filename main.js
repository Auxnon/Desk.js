var doubleTapSpeed=300;

var screenWidth;
var screenHeight;
var cellWidth;
var cellHeight;
var canvas;
var cell=[];
var player={x:0,y:0,ix:0,iy:0};
var entities=[];
var scr;
var targets=[];
var targetsHashed=[];
var double=false;
var multiDouble=0;
var scaleTrigger=false;
var pressThrough=true;

var bubbleMenu=null;


//var vacuumMode=false;

function init(){
	let panes=$('.draggable');
	applyPaneMods(panes);
	panes.each(function(i,e){
		$(this).css('z-index',i);
	});
	let main=$("#main");
	main.on("pointerup",pointerUp).on("pointerdown",mainDown)
	.on("pointermove",pointerMove).css("touch-action","none").on('paste',pasteEvent)
	.contextmenu(mainContext);
	main[0].addEventListener("drop",dropItem);
	main[0].addEventListener("dragover",dragItemOver);
	
}
function applyPaneMods(pane){
	pane.on("pointerdown",pointerDown).contextmenu(paneContext)
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

function pointerDown(e){
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
}	
//annoying polyfills until Safari (at least for iPads) supports pointer events
function touchMove(e){
	gestureMove(e,)
}
function pointerMove(e){
	gestureMove(e,e.pointerId);
}
function gestureMove(e,id){

	if(targets.length){
		let targetObj=targetsHashed[e.pointerId];
		if(targetObj && targetObj.entity){
			let entity=targetObj.entity;
			let pw=targetObj.parent.outerWidth();
			let ph=targetObj.parent.outerHeight();
			//sanity management, purge pointers that leave the screen
			if(e.clientX>pw || e.clientX<0 || e.clientY>ph || e.clientY<0){
				console.log('early pointer purge');
				pointerPurge(e.pointerId);
				return;
			}
			let maxW=pw-entity.outerWidth();
			let maxH=ph-entity.outerHeight();
			
			let left=e.clientX+targetObj.offsetX;
			let top=e.clientY+targetObj.offsetY;

			if(left>maxW)
				left=maxW;
			if(left<0)
				left=0;
			if(top>maxH)
				top=maxH;
			if(top<0)
				top=0;

			if(targetObj.linked && targetObj.linked.array.length>1){
				/*if(targetObj.pid!=e.pointerId){
					targetObj.multiples.forEach((ent,i)=>{
						if(ent.pid==e.pointerId){
							let dx=e.clientX-ent.originX;
							let dy=e.clientY-ent.originY;
							targetObj.entity.css({width:(targetObj.w+dx),height:(targetObj.h+dy)});;
							
							return;
						}
					})
				}*/
				targetObj.x=e.clientX;
				targetObj.y=e.clientY;

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

					entity.css({left:lowest.x+"px",top:lowest.y+"px",width:w+"px",height:h+"px"});
				//}
			}else{
				entity.css({left:left+"px",top:top+"px"});
				targetObj.x=e.clientX;
				targetObj.y=e.clientY;
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
						obj.entity.css({left:L,top:T});
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
		if(bubbleMenu && bubbleMenu.pid==e.pointerId){
			moveBubbleSelector(e.clientX,e.clientY);
		}
	}

	
}

function pointerUp(e){
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
	pointerPurge(e.pointerId);
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
				targetObj.linked.array[0].w=targetObj.entity.width();
				targetObj.linked.array[0].h=targetObj.entity.height();
				targetObj.linked.array[0].offsetX=targetObj.entity.position().left-targetObj.linked.array[0].x;
				targetObj.linked.array[0].offsetY=targetObj.entity.position().top-targetObj.linked.array[0].y;
				targetObj.linked.array[0].linked=null;
				console.log('solo pointer')
			}
		}else if(targetObj.entity){ //if a singular pointer, do some trivial nonsense
			targetObj.entity.removeClass("dragging vacuum selected");
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
	}

	if(bubbleMenu && bubbleMenu.pid==id){
		stopBubbleMenu();
	}
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
	$(this).addClass('vacuum');
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

$(init);