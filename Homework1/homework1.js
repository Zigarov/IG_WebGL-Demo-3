// HOMEWORK 1 by Pignata Giovanni 1913547

"use strict";

var canvas;
var gl;
var program;

// GEOMETRY PARAMETERS:
// The table is a stack of 3 cubes whit faces of different shapes, for a total of 36*3 coordinates.

var n = 3;                  				// Number of cubes.
var numPositions = 36*n;    				// Number of  vertices needed to draw the object.
var positions = [];  						// Array to load in the buffer data with the position of the vertices for drawing triangles.
var normals = [];      						// Array of normals associated to each vertex.
var tangents = [];      					// Array of tangents associated to each vertex.
var texCoords = [];							// Array of Texture Coordinates associated to each vertex.

var origin = vec3(10.0, 0.0, 0.0) 			// Origin of the axis of the rotation.
var axis = 0;               				// Axis of Rotation. [x = 0, y = 1, z = 2]
var theta = vec3(0, 0, 0);  				// Angles of Rotation.
var direction = 0;							// Variable that control the animation [ 0 = motionless, 1 = counterclockwise, -1 clockwise]
var transformMatrix;						// Transforrmation matrix used to render the animation.
var nMatrix;

// VIEWING SETTINGS:
/*
  I will use the lookAt function to set the camera in a (variable) point in the object space,
  the vec3 eye.
*/

// Camera Coordinates:
var xCamera = 0.0;				
var yCamera = 20.0;
var zCamera = 10.0;

// Camera Parameters
var eye = vec3(0.0, 0.0, 0.0);  		// Viewer Position: [xCamera, yCamera, zCamera]
const at = vec3(0.0, 0.0, 0.0); 		// Set where the camera point in the object space. For the purpose of the homework it can be constant.
const up = vec3(0.0, 1.0, 0.0); 		// Set the top of the camera.
var modelViewMatrix;					

// ProjectionMatrix Parameters::
var projectionMatrix;
var near = 1.0;       								// Distance of the near face of the viewing Volume.
var far = 60.0;        								// Distance of the far face of the viewing Volume.
var fovy = 80.0;      								// Field-of-view in Y direction angle (in degrees).
var aspect;           								// Viewport aspect ratio.


// SPOTLIGHT PROPERTIES:
var lightEnabled = true; 							// Boolean that controls if the spotlight is turned on.							
var lightPosition = vec4(0.0, 30.0, 0.0, 1.0);		// Position of the spotlight.
var lightDirection = vec4(							// Spotlight Initial Direction.
	lightPosition[0],
	lightPosition[1], 
	lightPosition[2], 
	0.0);
var lightAngle = 20;								// Cut-off Angle of the spotlight.

// Light Color Parameters:
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);		
var lightDiffuse = vec4(1.0, 1., 0.8, 1.);
var lightSpecular = vec4(1.0, 1.0, 0.8, 1.0);

// Light Attenuation factors:
var lightAttenuationCostant = 1.0; 					
var lightAttenuationLinear = 0.01;
var lightAttenuationQuadratic = 0.0005;

// Material parameters:
var materialAmbient = vec4(0.5, 0.5, 0.5, 1.0);
var materialDiffuse = vec4(.56, 0.32, 0.32, 1.0);
var materialSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var materialShininess = 50.0;

// Product:
var ambientProduct = mult(lightAmbient,materialAmbient);
var diffuseProduct = mult(lightDiffuse,materialDiffuse);
var specularProduct = mult(lightSpecular,materialSpecular);

// Controls:
var vertexShading = false; 									// Boolean that control which type of shading to use.
var texOn = true;											// Boolean that control if texture are rendered.
var texture; 

init();

function init() {
//Inizialization...
	canvas = document.getElementById("gl-canvas");
	gl = canvas.getContext('webgl2');
	if (!gl) alert( "WebGL 2.0 isn't available");

	gl.viewport(0, 0, canvas.width, canvas.height);
	aspect =  canvas.width/canvas.height;
	gl.clear(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);

//Load Shaders...	
	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);
	
//Compute Geometry...
	myTable();

//BINDING:
//	Positions...
	var vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);

	var positionLoc = gl.getAttribLocation(program, "aPosition");
	gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(positionLoc);

//	Tangents...
	var tBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer);
	gl.bufferData( gl.ARRAY_BUFFER, flatten(tangents), gl.STATIC_DRAW);

	var tangentLoc = gl.getAttribLocation( program, "aTangent");
	gl.vertexAttribPointer(tangentLoc, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(tangentLoc);

//	Normals...
	var nBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

	var normalLoc = gl.getAttribLocation(program, "aNormal");
	gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(normalLoc);

// Texture...
	var texBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW);

	var texCoordLoc = gl.getAttribLocation(program, "aTexCoord");
	gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(texCoordLoc);

	var image = document.getElementById("texImage");
	configureTexture(image);
	
// Material Parameters...
	gl.uniform4fv(gl.getUniformLocation(program, "uMaterial.ambientProduct"), ambientProduct);
	gl.uniform4fv(gl.getUniformLocation(program, "uMaterial.diffuseProduct"), diffuseProduct);
	gl.uniform4fv(gl.getUniformLocation(program, "uMaterial.specularProduct"), specularProduct);
	gl.uniform4fv(gl.getUniformLocation(program, "uMaterial.emissive"), vec4(0.0,0.0,0.0,1.0));
	gl.uniform1f(gl.getUniformLocation(program, "uMaterial.shininess"), materialShininess);

// Light Parameters...
	gl.uniform1i(gl.getUniformLocation(program, "uSpotLight.enabled"), lightEnabled);
	gl.uniform4fv(gl.getUniformLocation(program, "uSpotLight.position"), lightPosition);
	gl.uniform4fv(gl.getUniformLocation(program, "uSpotLight.direction"), lightDirection);
	gl.uniform1f(gl.getUniformLocation(program, "uSpotLight.threshold"), Math.cos(lightAngle*Math.PI/180));  //!
	gl.uniform1f(gl.getUniformLocation(program, "uSpotLight.attenuationCostant"), lightAttenuationCostant);
	gl.uniform1f(gl.getUniformLocation(program, "uSpotLight.attenuationLinear"), lightAttenuationLinear);
	gl.uniform1f(gl.getUniformLocation(program, "uSpotLight.attenuationQuadratic"), lightAttenuationQuadratic);
	
// Shading...
	gl.uniform1i(gl.getUniformLocation(program,"uVertexShading"), vertexShading);

//EVENT LISTENERS:
//  Rotation:
	document.getElementById("Axis").onchange = function(event) { axis = event.target.value; };
	document.getElementById("direction").onchange = function(event) {direction = event.target.value}
//  Viewer Volume:
	document.getElementById("fovySlider").onchange = function(event) { fovy = event.target.value; };
	document.getElementById("zFarSlider").onchange = function(event) { far = event.target.value; };
	document.getElementById("zNearSlider").onchange = function(event) { near = event.target.value; };
//  Camera Position:
	document.getElementById("xCam").onchange = function(event) { xCamera = event.target.value; };
	document.getElementById("yCam").onchange = function(event) { yCamera = event.target.value; };
	document.getElementById("zCam").onchange = function(event) { zCamera = event.target.value; };

//	Light Properties:
	document.getElementById("btnLight").onclick = function(event) { lightEnabled = !lightEnabled;};
	document.getElementById("lightAngle").onchange = function(event) {lightAngle = event.target.value;};
	document.getElementById("xDirection").onchange = function(event) {lightDirection[0] = -event.target.value;};
	document.getElementById("yDirection").onchange = function(event) {lightPosition[1] = event.target.value;};
	document.getElementById("zDirection").onchange = function(event) {lightDirection[2] = event.target.value;};
//	Shading:
	document.getElementById("shading").onchange= function(event) { vertexShading = event.target.value; };
// 	Texture:
	document.getElementById("btnTex").onclick = function(event) { texOn = !texOn;};

//Render...
	render();
}

function render() {
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

//  Update the camera position...
	eye = vec3(xCamera,yCamera,zCamera);

//Compute and Link the ProjectionMatrix...
	projectionMatrix = perspective(fovy, aspect, near, far);
	gl.uniformMatrix4fv( gl.getUniformLocation(program, "uProjectionMatrix"), false, flatten(projectionMatrix));

//	Update Controls...
	gl.uniform1i(gl.getUniformLocation(program,"uVertexShading"), vertexShading);
	gl.uniform1i(gl.getUniformLocation(program,"uTexOn"), texOn);

//	Update Light parameters...
	gl.uniform4fv(gl.getUniformLocation(program, "uSpotLight.position"), lightPosition);
	gl.uniform4fv(gl.getUniformLocation(program, "uSpotLight.direction"), lightDirection);
	gl.uniform1i(gl.getUniformLocation(program, "uSpotLight.enabled"), lightEnabled);
	gl.uniform1f(gl.getUniformLocation(program, "uSpotLight.threshold"), Math.cos(lightAngle*Math.PI/180));  //!

//	Compute the modelViewMatrix...
	modelViewMatrix = lookAt(eye, at, up);
	gl.uniformMatrix4fv(gl.getUniformLocation(program, "uModelViewMatrix"), false, flatten(modelViewMatrix));

//  Compute Transformation Matrix...
	theta[axis] += 2.0 * direction;
	transformMatrix = modelViewMatrix; 
	transformMatrix = mult(transformMatrix,translate(origin[0],origin[1],origin[2]));
	transformMatrix = mult(transformMatrix, rotateX(theta[0]));
	transformMatrix = mult(transformMatrix, rotateY(theta[1]));
	transformMatrix = mult(transformMatrix, rotateZ(theta[2]));
	transformMatrix = mult(transformMatrix,translate(-origin[0],-origin[1],-origin[2]));
	gl.uniformMatrix4fv(gl.getUniformLocation(program, "uTransformMatrix"), false, flatten(transformMatrix));

//  Compute normalMatrix..
    nMatrix = normalMatrix(modelViewMatrix, true);
	gl.uniformMatrix3fv( gl.getUniformLocation(program, "uNormalMatrix"), false, flatten(nMatrix));

//	Draw the table...
	gl.drawArrays(gl.TRIANGLES, 0, numPositions);
	requestAnimationFrame(render);
}


function myTable() {
//  Geom Parameters:
	var d = 10.0;                // general length
	var l = [d/4, d/4, d];      // base length (XZ)
	var h = [d/4, d/4, d/8];    // cube height (Y)
	var b = [-0.5, 0.5, -0.5];  // bias
	var y0 = -d;
//  Draw Cubes:
	for (var i = 0; i<n; i++) {
		y0 = y0 + h[i];
		myCube(0.0, y0, 0.0, l[i], h[i], b[i], i+1);
		y0 = y0 + h[i];
	}
	console.log(y0)
}

function myCube(x0, y0, z0, l, h, b, c) {
	const vertices = [
		vec4(x0 - (l - h*b), y0 - h, z0 + (l - h*b), 1.0),
		vec4(x0 - (l + h*b), y0 + h, z0 + (l + h*b), 1.0),
		vec4(x0 + (l + h*b), y0 + h, z0 + (l + h*b), 1.0),
		vec4(x0 + (l - h*b), y0 - h, z0 + (l - h*b), 1.0),

		vec4(x0 - (l - h*b), y0 - h, z0 - (l - h*b), 1.0),
		vec4(x0 - (l + h*b), y0 + h, z0 - (l + h*b), 1.0),
		vec4(x0 + (l + h*b), y0 + h, z0 - (l + h*b), 1.0),
		vec4(x0 + (l - h*b), y0 - h, z0 - (l - h*b), 1.0)
	];

	const idx = [
		[1, 0, 3, 1, 3, 2],
		[2, 3, 7, 2, 7, 6],
		[3, 0, 4, 3, 4, 7],
		[6, 5, 1, 6, 1, 2],
		[4, 5, 6, 4, 6, 7],
		[5, 4, 0, 5, 0, 1]
	];

	const texIdx = [0, 1, 2, 0, 2, 3];

	const texCoord = [
		vec2(0, 0),
		vec2(0, 1),
		vec2(1, 1),
		vec2(1, 0)
	]

	for (var i = 0; i < 6; i++) {
		var t1 = subtract(vertices[idx[i][1]], vertices[idx[i][0]]);
		var t2 = subtract(vertices[idx[i][2]], vertices[idx[i][1]]);
		var normal = cross(t1, t2);
		var tangent = vec3(t1[0],t1[1],t1[2]);
		normal = vec3(normal[0],normal[1],normal[2]);
		for (var j = 0; j < 6; j++) {
			positions.push(vertices[idx[i][j]]);
			texCoords.push(texCoord[texIdx[j]]);
			normals.push(normal);
			tangents.push(tangent);
		}
	}
}

function configureTexture( image ) {
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB,
         gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                      gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.uniform1i(gl.getUniformLocation(program, "uTexMap"), 0);
}