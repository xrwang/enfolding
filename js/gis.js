var maps = []; //array to store images
var mapFocus = 0; //number in array to focus
var buttonNodes;
var buttonDist;
var buttonMatrix;
var mode = 0; //mode 0 = edit nodes, 1 = edit distances

function setup() {
  // create canvas
  var c = createCanvas(1500, 800);
  colorMode(HSB,360,100,100,100)
  background(100,0,50,100);
  // Add an event for when a file is dropped onto the canvas
  c.drop(gotFile);
  
  buttonNodes = createButton('add nodes');
  buttonDist = createButton('edit distances');
  buttonMatrix = createButton('make matrix');
  buttonNodes.position(10,0);
  buttonDist.position(100,0);
  buttonMatrix.position(200,0);
  buttonNodes.mousePressed(mode0); //must be a better way to do this
  buttonDist.mousePressed(mode1);
  buttonMatrix.mousePressed(makeMatrix);
}

function draw() {
  fill(255,0,100,100);
  noStroke();
  textSize(24);
  textAlign(CENTER);
  text('Drag and drop a map', width/2, height/2);
  createDiv('data: ').id('dataResults');
  noLoop();
}

function gotFile(file) {
  if (file.type === 'image') {
	// Create an image DOM element and add to maps array
	append(maps,new Map(file.name,1,createImg(file.data).hide()));
	mapFocus = maps.length - 1; //change focus to last uploaded map
	console.log('map focus: ' + 	mapFocus);
  } else {
	println('Not an image file!');
  }
  displayMaps();
  displayGraphs();
  updateData();
}

//map class
function Map(name, opac, img){
	this.name = name;
	this.opac = opac;
	this.img = img;
	this.internalNodes = [];
	this.internalEdges = [];
	this.offSetX = 30;
	this.offSetY = 30;
	
	//start with 4 nodes at corners
	append(this.internalNodes, new Node(0,0));
	append(this.internalNodes, new Node(this.img.width,0));
	append(this.internalNodes, new Node(this.img.width, this.img.height));
	append(this.internalNodes, new Node(0,this.img.height));
	
	//and 4 edges that connect them
	append(this.internalEdges, new Edge(0,1,nodeDist(this.internalNodes[0],this.internalNodes[1])));
	append(this.internalEdges, new Edge(1,2,nodeDist(this.internalNodes[1],this.internalNodes[2])));
	append(this.internalEdges, new Edge(2,3,nodeDist(this.internalNodes[2],this.internalNodes[3])));
	append(this.internalEdges, new Edge(3,0,nodeDist(this.internalNodes[3],this.internalNodes[0])));
	
	for(var j = 0; j < this.internalEdges.length; j++){
		makeInput(this.internalEdges[j], this.internalNodes, j, this.offSetX, this.offSetY);
	}
	
	strokeWeight(3);
	stroke(0,100,0,50);
	this.display = function(){  
		image(this.img,this.offSetX,this.offSetY,this.img.width,this.img.height);
		
		//display nodes
    	for(var i=0; i < this.internalNodes.length; i++){
    		ellipse(this.internalNodes[i].xpos+this.offSetX,this.internalNodes[i].ypos+this.offSetY, 10, 10);
    	} 
    	//display edges
    	for(var i=0; i < this.internalEdges.length; i++){
    		var x1 = this.internalNodes[this.internalEdges[i].node1].xpos + this.offSetX;
    		var x2 = this.internalNodes[this.internalEdges[i].node2].xpos + this.offSetX;
    		var y1 = this.internalNodes[this.internalEdges[i].node1].ypos + this.offSetY;
    		var y2 = this.internalNodes[this.internalEdges[i].node2].ypos + this.offSetY;
    		line(x1,y1,x2,y2);	
    	}
	};
	
	this.displayGraph = function(goffSetX, goffSetY){
	//display nodes
    	for(var i=0; i < this.internalNodes.length; i++){
    		ellipse(this.internalNodes[i].xpos+this.offSetX + goffSetX,this.internalNodes[i].ypos+this.offSetY+ goffSetY, 10, 10);
    	} 
    	//display edges
    	for(var i=0; i < this.internalEdges.length; i++){
    		var x1 = this.internalNodes[this.internalEdges[i].node1].xpos + this.offSetX + goffSetX;
    		var x2 = this.internalNodes[this.internalEdges[i].node2].xpos + this.offSetX + goffSetX;
    		var y1 = this.internalNodes[this.internalEdges[i].node1].ypos + this.offSetY + goffSetY;
    		var y2 = this.internalNodes[this.internalEdges[i].node2].ypos + this.offSetY + goffSetY;
    		line(x1,y1,x2,y2);	
    	}
	};
	
	//called when mouseReleased
		this.addNode = function(mx,my){
		if(mx > this.offSetX && mx < this.offSetX + this.img.width && my > this.offSetY && my < this.offSetY + this.img.height){ //check if on map
				append(this.internalNodes, new Node(mx-this.offSetX,my-this.offSetY));
				
				//third argument = n nearest nodes to connect to
				var nodeShort = findClosestNNodes(mx-this.offSetX,my-this.offSetY, 2, this.internalNodes);  
				//console.log(nodeShort);
				for(var i = 0; i < nodeShort.length; i++){
					append(this.internalEdges, new Edge(nodeShort[i], this.internalNodes.length - 1, nodeDistXY(this.internalNodes[nodeShort[i]], mx-this.offSetX,my-this.offSetY)));
					makeInput(this.internalEdges[this.internalEdges.length-1], this.internalNodes, this.internalEdges.length-1, this.offSetX, this.offSetY);
				}
				//console.log(this.internalEdges[this.internalEdges.length-1]);
		displayMaps();
		displayGraphs();
	    updateData();
	};
	}	
}

//node class
function Node(xpos, ypos){
	this.xpos = xpos;
	this.ypos = ypos;
	
	this.display = function(){
		ellipse(this.xpos, this.ypos);
	};
}	

//edge class, takes node pairs by order in array
function Edge(node1, node2, distance){
	this.node1 = node1;
	this.node2 = node2;
	this.distance = distance;
	this.distanceMod = distance;
}

//NOT IN USE::TO DELETE returns closest existing node to new node
function findClosestNode(mx,my,iNodes){
	var smallestD = 10000000;
	var nodeID;
	for(var i = 0; i < 4; i++){ //check edge nodes for distance
		distN = dist(iNodes[i].xpos, iNodes[i].ypos, mx,my);
		if (distN < smallestD){
			nodeID = i;
			smallestD = distN;
		}
	}
	return nodeID;
}

//connect to n nearest nodes
function findClosestNNodes(mx, my, n, nodes){
	var closest = [];
	var nodeIDs = [];
	for(var i = 0; i < nodes.length; i++){
		var distN = dist(nodes[i].xpos, nodes[i].ypos, mx, my);
		if(distN != 0){ //to avoid comparing to self
			append(closest, {distance:distN, id:i});
		}	
	}
	//sort by distances, lowest to highest
	closest.sort(function(a, b) {return parseFloat(a.distance) - parseFloat(b.distance);});
	
	//return nodeIDS for the n closest nodes
	for(var i = 0; i < n; i++){
		append(nodeIDs, closest[i].id);
	}
	//console.log(nodeIDs);
	return nodeIDs;
}

//returns distance btw two nodes
function nodeDist(nn1,nn2){
	return dist(nn1.xpos,nn1.ypos,nn2.xpos,nn2.ypos);	
}

//make dist input box
function makeInput(edge, nodes, n, xOff, yOff){
	input = createInput();
	var x1 = nodes[edge.node1].xpos+xOff;
	var x2 = nodes[edge.node2].xpos+xOff;
	var y1 = nodes[edge.node1].ypos+yOff;
	var y2 = nodes[edge.node2].ypos+yOff;
	
	//console.log(edge.node1);
	
    input.position(x1+(x2-x1)/2, y1+(y2-y1)/2);
    input.value(int(edge.distance));
    input.id(n); //adds id that refers to edge
    input.attribute("onkeydown", "keypress(event, " + n + ")");
}

//keypress for input boxes
function keypress(event, id){
	var key = event.keyCode;
	if (key == 13){ //trigger for enter key
		var inputFocus = document.getElementById(id);
		var inVal = inputFocus.value; 
		maps[mapFocus].internalEdges[id].distanceMod = inVal;
		console.log(inVal); 
		inputFocus.value = inVal + '/' + int(maps[mapFocus].internalEdges[id].distance);
		updateData();
	}
}

//returns distance btw node and x,y
function nodeDistXY(nn1,mx,my){
	return dist(nn1.xpos,nn1.ypos,mx,my);
}


//build empty matrix, run through Floyd Warshall and MDS
function makeMatrix(){
	var nodes = maps[mapFocus].internalNodes;
	var edges = maps[mapFocus].internalEdges;
	var matrix = [];
	var infStr = [];
	
	//from http://stackoverflow.com/questions/6495187/best-way-to-generate-empty-2d-array
	var matrix = (function(matrix){ while(matrix.push([]) < nodes.length); return matrix})([]);
	
	//create array of empty values (= 'infinity') for each node
	//for(var i = 0; i < nodes.length; i++){
	//		append(infStr,-1); 
	//	}
	//populate matrix 
	//for(var i = 0; i < nodes.length; i++){
	//	matrix.push(infStr);
	//}
	//matrix[1][0] = 100;
	//populate empty matrix from edge info
	for(var i = 0; i < edges.length; i++){
		var x = edges[i].node1;
		var y = edges[i].node2;
		var dis = parseFloat(edges[i].distanceMod);
		//console.log(x + ' ' + y + ' ' + dis);
		//distances are equal in both directions
		//populates both spots n matrix by switching x/y
		matrix[x][y] = dis;
		matrix[y][x] = dis;
	}
	//cycle through all values replacing 'undefined' with 'Infinity'
	//KLUDGE
	for(var y = 0; y < nodes.length; y++){
		for(var x = 0; x < nodes.length; x++){			
			if(matrix[x][y] === undefined){
				matrix[x][y] = 'Infinity';
			}
		}
	}		
	//console.log(matrix);
	
	//calculate Infinity entries with Floyd Warshall algo
	var shortestDists = floydWarshall(matrix);
	//console.log(shortestDists);
	
	//calculate MDS
	//console.log(mdsCoords(shortestDists));
	displayMaps();
    	displayGraphs();
    	updateData();
	plotMdsGraph(shortestDists, edges);
	
}

function plotMdsGraph(coords, es){
	push();
	translate(1200,-140); //KLUDGE!
	rotate(PI/4);
	for(var i = 0; i < es.length; i++){
		var x1 = coords[es[i].node1][0]/1.5;
		var x2 = coords[es[i].node2][0]/1.5;
		var y1 = coords[es[i].node1][1]/1.5;
		var y2 = coords[es[i].node2][1]/1.5;
		ellipse(x1,y1,10,10);
		ellipse(x2,y2,10,10);
		line(x1,y1,x2,y2);
	}
	/*for(var i = 0; i < coords.length; i++){
		var x = coords[i][0]/1.5;
		var y = coords[i][1]/1.5;
		ellipse(x,y,5,5);
		console.log(x + ' ' + y);
	}*/
	pop();
}

function displayMaps(){
	background(255,0,100,100);
	for (var i=0; i<maps.length; i++) {
    	maps[i].display();
  	}
}

function displayGraphs(){
	for (var i=0; i<maps.length; i++) {
    	maps[i].displayGraph(maps[i].img.width+50, 0);
  	}
}

function mouseReleased(){
	if(mode == 0){
		maps[mapFocus].addNode(mouseX, mouseY);
	}
	return false;
}

//add data to end of page for testing and cut-and-pasting to R
function updateData(){
	var div = document.getElementById('dataResults');
	div.innerHTML = ''; //clear data results
	for (var i=0; i<maps.length; i++) {
		div.innerHTML = div.innerHTML + '<b>IMAGE: </b><br /> id: ' + i + ', ' + maps[i].name + ', w: ' + maps[i].img.width + ', h: ' + maps[i].img.height + '<br />';
		div.innerHTML = div.innerHTML + '<b>NODES: </b><br />';
		for(var j=0; j < maps[i].internalNodes.length; j++){
			div.innerHTML = div.innerHTML + 'id: ' + j + ', x: ' + maps[i].internalNodes[j].xpos + ', y: ' + maps[i].internalNodes[j].ypos + '<br />'; 
		}
		div.innerHTML = div.innerHTML + '<b>EDGES: </b><br />';
		for(var j=0; j < maps[i].internalEdges.length; j++){
			div.innerHTML = div.innerHTML + 'id: ' + j + ' distance: ' + int(maps[i].internalEdges[j].distance) + ' distanceMod: ' + int(maps[i].internalEdges[j].distanceMod) + ' node1: ' + maps[i].internalEdges[j].node1 + ' node2: ' + maps[i].internalEdges[j].node2 +   '<br />';
		}
  	}
}

function mode0(){
	mode = 0;
	console.log('mode = 0');
}

function mode1(){
	mode = 1;
	console.log('mode = 1');
}

//from http://www.benfrederickson.com/multidimensional-scaling/
function mdsCoords(distances, dimensions) {
	dimensions = dimensions || 2;

	// square distances
	var M = numeric.mul(-.5, numeric.pow(distances, 2));

	// double centre the rows/columns
	function mean(A) { return numeric.div(numeric.add.apply(null, A), A.length); }
	var rowMeans = mean(M),
		colMeans = mean(numeric.transpose(M)),
		totalMean = mean(rowMeans);

	for (var i = 0; i < M.length; ++i) {
		for (var j =0; j < M[0].length; ++j) {
			M[i][j] += totalMean - rowMeans[i] - colMeans[j];
		}
	}

	// take the SVD of the double centred matrix, and return the
	// points from it
	var ret = numeric.svd(M),
		eigenValues = numeric.sqrt(ret.S);
	return ret.U.map(function(row) {
		return numeric.mul(row, eigenValues).splice(0, dimensions);
	});
};
	
//from https://mgechev.github.io/javascript-algorithms/graphs_shortest-path_floyd-warshall.js.html
(function (exports) {
  'use strict';
  var floydWarshall = (function () {
    /**
     * Matrix used for the algorithm.
     */
    var dist;
    /**
     * Initialize the distance matrix.
     *
     * @private
     * @param {Array} graph Distance matrix of the array.
     * @return {Array} Distance matrix used for the algorithm.
     */

    function init(graph) {
      var dist = [];
      var size = graph.length;
      for (var i = 0; i < size; i += 1) {
        dist[i] = [];
        for (var j = 0; j < size; j += 1) {
          if (i === j) {
            dist[i][j] = 0;
          } else if (!isFinite(graph[i][j])) {
            dist[i][j] = Infinity;
          } else {
            dist[i][j] = graph[i][j];
          }
        }
      }
      return dist;
    }
    /**
     * Floyd-Warshall algorithm. Finds the shortest path between
     * each two vertices.<br><br>
     * Complexity: O(|V|^3) where V is the number of vertices.
     *
     * @public
     * @module graphs/shortest-path/floyd-warshall
     * @param {Array} graph A distance matrix of the graph.
     * @return {Array} Array which contains the shortest
     *    distance between each two vertices.
     *
     * @example
     * var floydWarshall =
     * require('path-to-algorithms/src/graphs/shortest-path/floyd-warshall').floydWarshall;
     * var distMatrix =
     *    [[Infinity, 7,        9,       Infinity,  Infinity, 16],
     *     [7,        Infinity, 10,       15,       Infinity, Infinity],
     *     [9,        10,       Infinity, 11,       Infinity, 2],
     *     [Infinity, 15,       11,       Infinity, 6,        Infinity],
     *     [Infinity, Infinity, Infinity, 6,        Infinity, 9],
     *     [16,       Infinity, 2,        Infinity, 9,        Infinity]];
     *
     * // [ [ 0, 7, 9, 20, 20, 11 ],
     * //   [ 7, 0, 10, 15, 21, 12 ],
     * //   [ 9, 10, 0, 11, 11, 2 ],
     * //   [ 20, 15, 11, 0, 6, 13 ],
     * //   [ 20, 21, 11, 6, 0, 9 ],
     * //   [ 11, 12, 2, 13, 9, 0 ] ]
     * var shortestDists = floydWarshall(distMatrix);
     */
    return function (graph) {
      dist = init(graph);
      var size = graph.length;
      for (var k = 0; k < size; k += 1) {
        for (var i = 0; i < size; i += 1) {
          for (var j = 0; j < size; j += 1) {
            if (dist[i][j] > dist[i][k] + dist[k][j]) {
              dist[i][j] = dist[i][k] + dist[k][j];
            }
          }
        }
      }
      return dist;
    };
  }());
  exports.floydWarshall = floydWarshall;
})(typeof window === 'undefined' ? module.exports : window);
