main();

//////////////////////////
//         main         //
//////////////////////////
function main() {
 	const canvas = document.querySelector("#glcanvas");
    // Initialisation du contexte GL
    const gl = canvas.getContext("webgl");
    // Continue seulement si WebGL est disponible et fonctionne
    if (!gl) {
        alert("Impossible d'initialiser WebGL.");
        return;
  	}

  // Récupérer le code du vertex shader dans l'html
  const vertexShaderSource = document.getElementById('shader-vs').textContent;//HTML pas analysé innerText ou innerHTML ou text   
  
  // Récupérer le du fragment shader dans l'html
  const fragmentShaderSource = document.getElementById('shader-fs').textContent;
  
  //Initialiser un programme shader, de façon à ce que WebGL sache comment dessiner nos données
  const shaderProgram = initShaderProgram(gl, vertexShaderSource, fragmentShaderSource);

  // Objet JS contenant toutes les informations nécessaires pour le shader program
  // Recherche quel emplacement est assigné à nos entrées (1 attribut et deux uniformes)
    const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),//création d'un pointeur pour les données de vertex
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
    },
  };

  // Appel la méthode qui construit tous les objets que nous allons dessiner
  const buffers = initBuffers(gl);

  //Rendu de la scène
  drawScene(gl, programInfo, buffers);
}


//////////////////////////
//     initBuffers      //
//////////////////////////
//Initialise les buffers dont nous avons besoin. 
//Un seul objet le triangle
function initBuffers(gl) {

  // Créer un tampon des coordonnées des sommets pour le triangle.
  const positionBuffer = gl.createBuffer();

  // Définir le positionBuffer comme étant celui auquel appliquer les opérations de tampon à partir d'ici.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  const positions = [ // prints a square with triangles
  -1.0 , -1.0 , 0 ,
  1 , -1 , 0 , 
  1 , 1 , 0 , 
  -1, 1, 0 ,
  ];

  gl.bufferData(gl.ARRAY_BUFFER,
                new Float32Array(positions),
                gl.STATIC_DRAW);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, null);




  //retourner l'ensemble des buffers crées
  const indicesBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);

  const indixes = [3,2,1,3,1,0];

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indixes),
    gl.STATIC_DRAW);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);


  // const colorsBuffer = gl.createBuffer();
  // gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
  // const colors = [
  //   1.0,0.0,0.0,
  //   0.0,1.0,0.0,
  //   0.0,0.0,1.0
  // ]
  // gl.bufferData(gl.ARRAY_BUFFER,
  //   new Float32Array(colors),
  //   gl.STATIC_DRAW);
  // gl.bindBuffer(gl.ARRAY_BUFFER, null);





  return {
    position: positionBuffer,
    indices: indicesBuffer,
    // colors: colorsBuffer
  };
}

//////////////////////////
//      drawScene       //
//////////////////////////
// Rendu de la scène.
function drawScene(gl, programInfo, buffers) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // effacement en noir, complètement opaque
  gl.clearDepth(1.0);                 // tout effacer
  gl.enable(gl.DEPTH_TEST);           // activer le test de profondeur
  gl.depthFunc(gl.LEQUAL);            // éliminer les parties cachées
  // Effacer le canevas avant que nous ne commencions à dessiner dessus.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Créer une matrice de perspective
  // Champ de vision de 45 degrés, avec un rapport largeur/hauteur qui correspond à la taille d'affichage du canvas, profondeur entre 0,1 et 100
  const fieldOfView = 45 * Math.PI / 180;   // en radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();

  // note: glmatrix.js a toujours comme premier argument la destination où stocker le résultat.  
  mat4.perspective(projectionMatrix,
                   fieldOfView,
                   aspect,
                   zNear,
                   zFar);

  // Définir la position de dessin comme étant le point "origine", qui est le centre de la scène.
  const modelViewMatrix = mat4.create();

  // translation
  mat4.translate(modelViewMatrix,     // destination matrix
                 modelViewMatrix,     // matrix to translate
                 [-0.0, 0.0, -6.0]);  // amount to translate

  // Indiquer à WebGL comment extraire les positions à partir du tampon des coordonnées (buffers.position) pour les mettre dans l'attribut vertexPosition.
  {
  	const numComponents = 3;  // 3 valeurs par itération
    const type = gl.FLOAT;    // les données dans le tampon sont des flottants 32bit
    const normalize = false;  // ne pas normaliser
    const stride = 0;         // combien d'octets à extraire entre un jeu de valeurs et le suivant
                              // 0 = utiliser le type et numComponents ci-dessus
    const offset = 0;         // démarrer à partir de combien d'octets dans le tampon


    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition);
  }

  // {
  //   gl.bindBuffer(gl.ARRAY_BUFFER, buffers.colorsBuffer);
  //   gl.vertexAttribPointer(
  //       programInfo.vertexColorAttribute,
  //       numComponents,
  //       type,
  //       normalize,
  //       stride,
  //       offset);
  //   gl.enableVertexAttribArray(
  //       programInfo.vertexColorAttribute);
  // }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);


  // Indiquer à WebGL d'utiliser notre programme pour dessiner
  gl.useProgram(programInfo.program);

  // Définir les uniformes du shader
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix);
      
  //Dessin de l'objet
  {
    const offset = 0;
    const vertexCount = 6;
    gl.drawElements(gl.TRIANGLES, vertexCount, gl.UNSIGNED_SHORT,offset);
  }
}

//////////////////////////
//   initShaderProgram  //
//////////////////////////
// Lie les deux shaders dans un programme shader de façon à ce que WebGL sache comment dessiner les données
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Créer le programme shader
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // Si la création du programme shader a échoué, alerte
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }
  return shaderProgram;
}

//////////////////////////
//       loadShader     //
//////////////////////////
// Crée un shader du type fourni, charge le source et le compile.
function loadShader(gl, type, source) {
  //Crée le shader
  const shader = gl.createShader(type);

  // Envoyer le source à l'objet shader
  gl.shaderSource(shader, source);

  // Compiler le programme shader
  gl.compileShader(shader);

  // Vérifier s'il a été compilé avec succès
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}