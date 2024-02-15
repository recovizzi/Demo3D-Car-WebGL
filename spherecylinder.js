// This program was developped by Daniel Audet and uses the file "basic-objects-IFS.js"
// from http://math.hws.edu/eck/cs424/notes2013/19_GLSL.html
//
//  It has been adapted to be compatible with the "MV.js" library developped
//  for the book "Interactive Computer Graphics" by Edward Angel and Dave Shreiner.
//

"use strict";

var gl;   // The webgl context.
var canvas;

var vcoordsmapLoc;      // Location of the attribute variables in the environment mapping shader program.
var vnormalmapLoc;
var vtexcoordmapLoc;

var projectionmapLoc;     // Location of the uniform variables in the environment mapping shader program.
var modelviewmapLoc;
var normalMatrixmapLoc;
var minvmapLoc;
var skyboxmapLoc;

var vcoordsLoc;       // Location of the coords attribute variable in the standard texture mappping shader program.
var vnormalLoc;
var vtexcoordLoc;

var projectionLoc;     // Location of the uniform variables in the standard texture mappping shader program.
var modelviewLoc;
var normalMatrixLoc;

var modelviewboxLoc;
var projectionboxLoc;
var skyboxLoc;


var textureLoc;
var renderingoptionLoc;


var zoom = 100;
let projectionCAM = [1, -20, 1];


var vcoordsboxLoc;     // Location of the coords attribute variable in the shader program used for texturing the environment box.
var vnormalboxLoc;
var vtexcoordboxLoc;


var projection;   //--- projection matrix
var modelview;    // modelview matrix
var flattenedmodelview;    //--- flattened modelview matrix

var Minv = mat3();  // matrix inverse of modelview

var normalMatrix = mat3();  //--- create a 3X3 matrix that will affect normals

var rotator;   // A SimpleRotator object to enable rotation by mouse dragging.
var wheelRotation = [0, 0, 0];
var phareRotation = 0;

var sphere, cylinder, box, mirrorObj, prism, object, envbox;  // model identifiers

var ColorWhite, ColorBlack, ColorBlue, ColorYellow, ColorGrey;
let face = [];

var hemisphereinside, hemisphereoutside, thindisk;
var quartersphereinside, quartersphereoutside;

var prog, progmap, progbox;  // shader program identifier

var lightPosition = vec4(20.0, 20.0, 100.0, 1.0);

var lightAmbient = vec4(1.0, 1.0, 1.0, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(0.0, 0.1, 0.3, 1.0);
var materialDiffuse = vec4(0.48, 0.55, 0.69, 1.0);
var materialSpecular = vec4(0.48, 0.55, 0.69, 1.0);
var materialShininess = 100.0;

var texIDmap0;  // environmental texture identifier

var testTexID;
var testLink = "Texture/UV_checker_Map.jpg";
var Testemp;
var wheelTexID;
var wheelLink = "Texture/jante.png";
var wheelinsideTexID;
var wheelinsideLink = "Texture/insidejante.png";
var tireTexID;
var tireLink = "Texture/line.jpg";
var windowsTopTexID;
var windowsTopLink = "Texture/windows1.png";
var windowsDownTexID;
var windowsDownLink = "Texture/windows2.png";
var windowsLatTexID;
var windowsLatLink = "Texture/windows3.png";
var windowsLat2TexID;
var windowsLat2Link = "Texture/windows4.png";
var windowsLat3TexID;
var windowsLat3Link = "Texture/windows5.png";
var windowemp;
var plaqueLeftTexID;
var plaqueLeftLink = "Texture/plaque1.png";
var plaqueRightTexID;
var plaqueRightLink = "Texture/plaque2.png";
var plaqueemp;
var phareTexID;
var phareLink = "Texture/phare.png";
var steelTexID;
var steelLink = "Texture/steel.png";
var soccerTexID;
var soccerLink = "Texture/soccer.png";
var basketTexID;
var basketLink = "Texture/basket.png";


var rotX = 0, rotY = 0;  // Additional rotations applied as modeling transform to the teapot.

var ct = 0;
var img = new Array(6);

var ntextures_tobeloaded = 0;
var ntextures_loaded = 0;

var texturelist = [];
var texcounter = 0;

var ambientProduct, diffuseProduct, specularProduct;

let ListMov = [];

function render() {
    gl.clearColor(0.79, 0.76, 0.27, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    projection = perspective(100.0, 1.0, 1.0, 2000.0);


    //--- Get the rotation matrix obtained from the displacement of the mouse
    //---  (note: the matrix obtained is already "flattened" by the function getViewMatrix)
    flattenedmodelview = rotator.getViewMatrix();
    modelview = unflatten(flattenedmodelview);


    if (ntextures_loaded == ntextures_tobeloaded) {

        var initialmodelview = modelview;


        // Draw the environment (box)
        gl.useProgram(progbox); // Select the shader program that is used for the environment box.

        gl.uniformMatrix4fv(projectionboxLoc, false, flatten(projection));

        gl.enableVertexAttribArray(vcoordsboxLoc);
        gl.disableVertexAttribArray(vnormalboxLoc);     // normals are not used for the box
        gl.disableVertexAttribArray(vtexcoordboxLoc);  // texture coordinates not used for the box

        // associate texture to "texture unit" 0
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texIDmap0);
        // Send texture number to sampler
        gl.uniform1i(skyboxLoc, 0);
        modelview = mult(modelview, rotate(wheelRotation[1], 0, 1, 0));
        modelview = mult(modelview, translate(projectionCAM[0] + 30, projectionCAM[1] - 10, projectionCAM[2] - 5));

        
        envbox.render();

        //  Draw first model using environmental mapping shader
        gl.useProgram(progmap);

        gl.uniformMatrix4fv(projectionmapLoc, false, flatten(projection)); // send projection matrix to the new shader program

        modelview = initialmodelview;

        modelview = mult(modelview, translate(0, 50,  10));
        modelview = mult(modelview, rotate(wheelRotation[1], 0, 1, 0));

        // Compute the inverse of the modelview matrix
        Minv = matrixinvert(modelview);

        modelview = mult(modelview, rotate(rotX, 1, 0, 0));
        modelview = mult(modelview, rotate(rotY, 0, 1, 0));

        normalMatrix = extractNormalMatrix(modelview);  // always extract normalMatrix before scaling


        gl.enableVertexAttribArray(vcoordsmapLoc);
        gl.enableVertexAttribArray(vnormalmapLoc);
        gl.disableVertexAttribArray(vtexcoordmapLoc);  // texture coordinates not used (environmental mapping)

        // associate texture to "texture unit" 0
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texIDmap0);
        // Send texture number to sampler
        gl.uniform1i(skyboxmapLoc, 0);
        modelview = mult(modelview, translate(projectionCAM[0] + 30, projectionCAM[1] - 10, projectionCAM[2] - 5));

        mirrorObj.render();  //  modelview and normalMatrix are sent to the shader in the "render()" method


        //  Now, change shader program to simply paste texture images onto models
        gl.useProgram(prog);
        gl.uniformMatrix4fv(projectionLoc, false, flatten(projection));  // send projection matrix to the new shader program
        gl.enableVertexAttribArray(vcoordsLoc);
        gl.enableVertexAttribArray(vnormalLoc);
        gl.enableVertexAttribArray(vtexcoordLoc);


        modelview = initialmodelview;
        modelview = mult(modelview, rotate(wheelRotation[1], 0, 1, 0));


        var materialAmbient = vec4(0.0, 0.1, 0.3, 1.0);
        var lightAmbient = vec4(1.0, 1.0, 1.0, 1.0);
        ambientProduct = mult(lightAmbient, materialAmbient);
        gl.uniform4fv(gl.getUniformLocation(prog, "ambientProduct"), flatten(ambientProduct));
        var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
        var materialDiffuse = vec4(0.48, 0.55, 0.69, 1.0);
        diffuseProduct = mult(lightDiffuse, materialDiffuse);
        gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));
        var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);
        var materialSpecular = vec4(0.48, 0.55, 0.69, 1.0);
        specularProduct = mult(lightSpecular, materialSpecular);
        gl.uniform4fv(gl.getUniformLocation(prog, "specularProduct"), flatten(specularProduct));
        var materialShininess = 100.0;
        gl.uniform1f(gl.getUniformLocation(prog, "shininess"), materialShininess);

        gl.uniform1i(renderingoptionLoc, 0);


        //  now, draw sphere model
        gl.activeTexture(gl.TEXTURE13);
        gl.bindTexture(gl.TEXTURE_2D, basketTexID);

        // Send texture number to sampler
        gl.uniform1i(textureLoc, 13);
        // assign "0" to renderingoption in fragment shader (texture and Phong model)
        gl.uniform1i(renderingoptionLoc, 1);

        modelview = initialmodelview;
        modelview = mult(modelview, rotate(wheelRotation[1], 0, 1, 0));
        modelview = mult(modelview, translate(projectionCAM[0] + 30, projectionCAM[1] - 10, projectionCAM[2] - 5));

        modelview = mult(modelview, translate(-100, 200, -150));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
        modelview = mult(modelview, scale(1, 1, 1));
        modelview = mult(modelview, rotate(wheelRotation[0]/10, 0, 1, 0));
        sphere.render();

        gl.activeTexture(gl.TEXTURE14);
        gl.bindTexture(gl.TEXTURE_2D, soccerTexID);

        // Send texture number to sampler
        gl.uniform1i(textureLoc, 14);
        // assign "0" to renderingoption in fragment shader (texture and Phong model)
        gl.uniform1i(renderingoptionLoc, 1);
        modelview = initialmodelview;
        modelview = mult(modelview, rotate(wheelRotation[1], 0, 1, 0));
        modelview = mult(modelview, translate(projectionCAM[0] + 30, projectionCAM[1] - 10, projectionCAM[2] - 5));

        modelview = mult(modelview, translate(-100, 200, -150));
        modelview = mult(modelview, rotate(wheelRotation[0]/10, 0, 1, 0));
        modelview = mult(modelview, rotate(-wheelRotation[0], 0, 1, 0));
        modelview = mult(modelview, translate(0, 0, -30));
        modelview = mult(modelview, rotate(wheelRotation[0], 0, 1, 0));
        
        sphere.render();

        // //  now, draw box model
        // modelview = initialmodelview;
        // modelview = mult(modelview, translate(0.0, 0.0, 0.0));
        // modelview = mult(modelview, rotate(0.0, 1, 0, 0));
        // normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
        // modelview = mult(modelview, scale(1, 1, 1));
        // box.render();


        //  now, draw prismes models

        // lighthouse
        gl.activeTexture(gl.TEXTURE7);
        gl.bindTexture(gl.TEXTURE_2D, phareTexID);

        // Send texture number to sampler
        gl.uniform1i(textureLoc, 7);
        // assign "0" to renderingoption in fragment shader (texture and Phong model)
        gl.uniform1i(renderingoptionLoc, 1);

        modelview = initialmodelview;
        modelview = mult(modelview, rotate(wheelRotation[1], 0, 1, 0));

        modelview = mult(modelview, translate(projectionCAM[0] - 48, projectionCAM[1] + 0.8, projectionCAM[2] + 14));
        modelview = mult(modelview, rotate(90.0, 1, 0, 0));
        modelview = mult(modelview, rotate(phareRotation, 0, 1, 0));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling

        materialDiffuse = vec4(0, 0, 0, 1.0);
        diffuseProduct = mult(lightDiffuse, materialDiffuse);
        gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));

        modelview = mult(modelview, scale(1, 1, 1));
        prism.render();

        modelview = initialmodelview;
        modelview = mult(modelview, rotate(wheelRotation[1], 0, 1, 0));

        modelview = mult(modelview, translate(projectionCAM[0] - 48, projectionCAM[1] + 0.8, projectionCAM[2] - 14));
        modelview = mult(modelview, rotate(90.0, 1, 0, 0));
        modelview = mult(modelview, rotate(phareRotation, 0, 1, 0));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling

        modelview = mult(modelview, scale(1, 1, 1));
        prism.render(); prism.render();

        gl.uniform1i(renderingoptionLoc, 0);

        // now, draw cylinder for engine

        gl.activeTexture(gl.TEXTURE12);
        gl.bindTexture(gl.TEXTURE_2D, steelTexID);

        // Send texture number to sampler
        gl.uniform1i(textureLoc, 12);
        // assign "0" to renderingoption in fragment shader (texture and Phong model)
        gl.uniform1i(renderingoptionLoc, 1);

        modelview = initialmodelview;
        modelview = mult(modelview, rotate(wheelRotation[1], 0, 1, 0));

        modelview = mult(modelview, translate(projectionCAM[0] + 12.5, projectionCAM[1] - 14, projectionCAM[2]));
        modelview = mult(modelview, rotate(90.0, 0, 1, 90));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling

        materialDiffuse = vec4(0, 0, 0, 1.0);
        diffuseProduct = mult(lightDiffuse, materialDiffuse);
        gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));

        modelview = mult(modelview, scale(0.2, 0.2, 3));
        cylinder.render();

        modelview = initialmodelview;
        modelview = mult(modelview, rotate(wheelRotation[1], 0, 1, 0));

        modelview = mult(modelview, translate(projectionCAM[0] - 37.5, projectionCAM[1] - 14, projectionCAM[2]));
        modelview = mult(modelview, rotate(90.0, 0, 1, 90));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling

        materialDiffuse = vec4(0, 0, 0, 1.0);
        diffuseProduct = mult(lightDiffuse, materialDiffuse);
        gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));

        modelview = mult(modelview, scale(0.2, 0.2, 3));
        cylinder.render();

        modelview = initialmodelview;
        modelview = mult(modelview, rotate(wheelRotation[1], 0, 1, 0));

        modelview = mult(modelview, translate(projectionCAM[0] - 12.5, projectionCAM[1] - 14, projectionCAM[2]));
        modelview = mult(modelview, rotate(90.0, 0, 1, 0));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling

        materialDiffuse = vec4(0, 0, 0, 1.0);
        diffuseProduct = mult(lightDiffuse, materialDiffuse);
        gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));

        modelview = mult(modelview, scale(0.2, 0.2, 5));
        cylinder.render();

        //  now, draw box model
        modelview = initialmodelview;
        modelview = mult(modelview, rotate(wheelRotation[1], 0, 1, 0));

        modelview = mult(modelview, translate(projectionCAM[0] - 37.5, projectionCAM[1] - 14, projectionCAM[2]));
        modelview = mult(modelview, rotate(0.0, 1, 0, 0));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
        modelview = mult(modelview, scale(8, 5, 8));
        box.render();

        //  now, draw box model
        modelview = initialmodelview;
        modelview = mult(modelview, rotate(wheelRotation[1], 0, 1, 0));

        modelview = mult(modelview, translate(projectionCAM[0] + 12.5, projectionCAM[1] - 14, projectionCAM[2]));
        modelview = mult(modelview, rotate(0.0, 1, 0, 0));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
        modelview = mult(modelview, scale(8, 5, 8));
        box.render();

        // Pot d'échappement

        modelview = initialmodelview;
        modelview = mult(modelview, rotate(wheelRotation[1], 0, 1, 0));

        modelview = mult(modelview, translate(projectionCAM[0] + 22.5, projectionCAM[1] - 10, projectionCAM[2] - 8));
        modelview = mult(modelview, rotate(90.0, 0, 1, 0));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling

        materialDiffuse = vec4(0, 0, 0, 1.0);
        diffuseProduct = mult(lightDiffuse, materialDiffuse);
        gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));

        modelview = mult(modelview, scale(0.2, 0.2, 1.5));
        cylinder.render();

        modelview = initialmodelview;
        modelview = mult(modelview, rotate(wheelRotation[1], 0, 1, 0));

        modelview = mult(modelview, translate(projectionCAM[0] + 22.5, projectionCAM[1] - 10, projectionCAM[2] - 5));
        modelview = mult(modelview, rotate(90.0, 0, 1, 0));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling

        materialDiffuse = vec4(0, 0, 0, 1.0);
        diffuseProduct = mult(lightDiffuse, materialDiffuse);
        gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));

        modelview = mult(modelview, scale(0.2, 0.2, 1.5));
        cylinder.render();

        //Bout pot d'échappement

        materialDiffuse = vec4(0.4, 0.5, 1);
        diffuseProduct = mult(lightDiffuse, materialDiffuse);
        gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));
        var materialAmbient = vec4(0.4, 0.5, 1, 0);
        var lightAmbient = vec4(1.0, 1.0, 1.0, 1.0);
        ambientProduct = mult(lightAmbient, materialAmbient);
        gl.uniform4fv(gl.getUniformLocation(prog, "ambientProduct"), flatten(ambientProduct));

        gl.uniform1i(renderingoptionLoc, 0);

        modelview = initialmodelview;
        modelview = mult(modelview, rotate(wheelRotation[1], 0, 1, 0));

        modelview = mult(modelview, translate(projectionCAM[0] + 30, projectionCAM[1] - 10, projectionCAM[2] - 8));
        modelview = mult(modelview, rotate(90.0, 0, 1, 0));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling

        materialDiffuse = vec4(0, 0, 0, 1.0);
        diffuseProduct = mult(lightDiffuse, materialDiffuse);
        gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));

        modelview = mult(modelview, scale(0.2, 0.2, 0.01));
        cylinder.render();

        modelview = initialmodelview;
        modelview = mult(modelview, rotate(wheelRotation[1], 0, 1, 0));

        modelview = mult(modelview, translate(projectionCAM[0] + 30, projectionCAM[1] - 10, projectionCAM[2] - 5));
        modelview = mult(modelview, rotate(90.0, 0, 1, 0));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling

        materialDiffuse = vec4(0, 0, 0, 1.0);
        diffuseProduct = mult(lightDiffuse, materialDiffuse);
        gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));

        modelview = mult(modelview, scale(0.2, 0.2, 0.01));
        cylinder.render();

        materialDiffuse = vec4(0.9, 0.6, 0.1);
        diffuseProduct = mult(lightDiffuse, materialDiffuse);
        gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));
        var materialAmbient = vec4(0.9, 0.6, 0.1, 0);
        var lightAmbient = vec4(1.0, 1.0, 1.0, 1.0);
        ambientProduct = mult(lightAmbient, materialAmbient);
        gl.uniform4fv(gl.getUniformLocation(prog, "ambientProduct"), flatten(ambientProduct));

        modelview = initialmodelview;
        modelview = mult(modelview, rotate(wheelRotation[1], 0, 1, 0));

        modelview = mult(modelview, translate(projectionCAM[0] + 30.01, projectionCAM[1] - 10, projectionCAM[2] - 8));
        modelview = mult(modelview, rotate(90.0, 0, 1, 0));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling

        materialDiffuse = vec4(0, 0, 0, 1.0);
        diffuseProduct = mult(lightDiffuse, materialDiffuse);
        gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));

        modelview = mult(modelview, scale(0.15, 0.15, 0.01));
        cylinder.render();

        modelview = initialmodelview;
        modelview = mult(modelview, rotate(wheelRotation[1], 0, 1, 0));

        modelview = mult(modelview, translate(projectionCAM[0] + 30.01, projectionCAM[1] - 10, projectionCAM[2] - 5));
        modelview = mult(modelview, rotate(90.0, 0, 1, 0));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling

        materialDiffuse = vec4(0, 0, 0, 1.0);
        diffuseProduct = mult(lightDiffuse, materialDiffuse);
        gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));

        modelview = mult(modelview, scale(0.15, 0.15, 0.01));
        cylinder.render();



        //  now, draw cylinder model Wheel

        // associate texture to "texture unit" 0
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, wheelTexID);

        // Send texture number to sampler
        gl.uniform1i(textureLoc, 1);
        // assign "0" to renderingoption in fragment shader (texture and Phong model)
        gl.uniform1i(renderingoptionLoc, 1);


        modelview = initialmodelview;
        modelview = mult(modelview, rotate(wheelRotation[1], 0, 1, 0));

        modelview = mult(modelview, translate(projectionCAM[0] + 12.5, projectionCAM[1] - 14, projectionCAM[2] + 17.1));
        modelview = mult(modelview, rotate(90, 0, 1, 90));
        // modelview = mult(modelview, rotate(wheelRotation[1], 1, 0, 0));
        modelview = mult(modelview, rotate(wheelRotation[0], 0, 0, 1));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling

        materialDiffuse = vec4(0, 0.2, 0.3, 1.0);
        diffuseProduct = mult(lightDiffuse, materialDiffuse);
        gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));

        modelview = mult(modelview, scale(1, 1, 0.2));
        cylinder.render();

        modelview = initialmodelview;
        modelview = mult(modelview, rotate(wheelRotation[1], 0, 1, 0));

        modelview = mult(modelview, translate(projectionCAM[0] - 37.5, projectionCAM[1] - 14, projectionCAM[2] + 17.1));
        modelview = mult(modelview, rotate(90.0, 0, 1, 90));
        modelview = mult(modelview, rotate(-wheelRotation[2], 1, 0, 0));
        modelview = mult(modelview, rotate(wheelRotation[0], 0, 0, 1));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling

        materialDiffuse = vec4(0, 0.2, 0.3, 1.0);
        diffuseProduct = mult(lightDiffuse, materialDiffuse);
        gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));

        modelview = mult(modelview, scale(1, 1, 0.2));
        cylinder.render();

        modelview = initialmodelview;
        modelview = mult(modelview, rotate(wheelRotation[1], 0, 1, 0));

        modelview = mult(modelview, translate(projectionCAM[0] + 12.5, projectionCAM[1] - 14, projectionCAM[2] - 17.1));
        modelview = mult(modelview, rotate(90.0, 0, 1, 90));
        // modelview = mult(modelview, rotate(wheelRotation[1], 1, 0, 0));
        modelview = mult(modelview, rotate(wheelRotation[0], 0, 0, 1));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling

        materialDiffuse = vec4(0, 0.2, 0.3, 1.0);
        diffuseProduct = mult(lightDiffuse, materialDiffuse);
        gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));

        modelview = mult(modelview, scale(1, 1, 0.2));
        cylinder.render();

        modelview = initialmodelview;
        modelview = mult(modelview, rotate(wheelRotation[1], 0, 1, 0));

        modelview = mult(modelview, translate(projectionCAM[0] - 37.5, projectionCAM[1] - 14, projectionCAM[2] - 17.1));
        modelview = mult(modelview, rotate(90.0, 0, 1, 90));
        modelview = mult(modelview, rotate(-wheelRotation[2], 1, 0, 0));
        modelview = mult(modelview, rotate(wheelRotation[0], 0, 0, 1));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling

        materialDiffuse = vec4(0, 0.2, 0.3, 1.0);
        diffuseProduct = mult(lightDiffuse, materialDiffuse);
        gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));

        modelview = mult(modelview, scale(1, 1, 0.2));
        cylinder.render();

        //  now, draw cylinder model Wheel

        // associate texture to "texture unit" 0
        gl.activeTexture(gl.TEXTURE11);
        gl.bindTexture(gl.TEXTURE_2D, wheelinsideTexID);

        // Send texture number to sampler
        gl.uniform1i(textureLoc, 11);
        // assign "0" to renderingoption in fragment shader (texture and Phong model)
        gl.uniform1i(renderingoptionLoc, 1);


        modelview = initialmodelview;
        modelview = mult(modelview, rotate(wheelRotation[1], 0, 1, 0));

        modelview = mult(modelview, translate(projectionCAM[0] + 12.5, projectionCAM[1] - 14, projectionCAM[2] + 12.9));
        modelview = mult(modelview, rotate(90.0, 0, 1, 90));
        // modelview = mult(modelview, rotate(wheelRotation[1], 1, 0, 0));
        modelview = mult(modelview, rotate(wheelRotation[0], 0, 0, 1));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling

        materialDiffuse = vec4(0, 0.2, 0.3, 1.0);
        diffuseProduct = mult(lightDiffuse, materialDiffuse);
        gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));

        modelview = mult(modelview, scale(1, 1, 0.2));
        cylinder.render();

        modelview = initialmodelview;
        modelview = mult(modelview, rotate(wheelRotation[1], 0, 1, 0));

        modelview = mult(modelview, translate(projectionCAM[0] - 37.5, projectionCAM[1] - 14, projectionCAM[2] + 12.9));
        modelview = mult(modelview, rotate(90.0, 0, 1, 90));
        modelview = mult(modelview, rotate(-wheelRotation[2], 1, 0, 0));
        modelview = mult(modelview, rotate(wheelRotation[0], 0, 0, 1));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling

        materialDiffuse = vec4(0, 0.2, 0.3, 1.0);
        diffuseProduct = mult(lightDiffuse, materialDiffuse);
        gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));

        modelview = mult(modelview, scale(1, 1, 0.2));
        cylinder.render();

        modelview = initialmodelview;
        modelview = mult(modelview, rotate(wheelRotation[1], 0, 1, 0));

        modelview = mult(modelview, translate(projectionCAM[0] + 12.5, projectionCAM[1] - 14, projectionCAM[2] - 12.9));
        modelview = mult(modelview, rotate(90.0, 0, 1, 90));
        // modelview = mult(modelview, rotate(wheelRotation[1], 1, 0, 0));
        modelview = mult(modelview, rotate(wheelRotation[0], 0, 0, 1));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling

        materialDiffuse = vec4(0, 0.2, 0.3, 1.0);
        diffuseProduct = mult(lightDiffuse, materialDiffuse);
        gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));

        modelview = mult(modelview, scale(1, 1, 0.2));
        cylinder.render();

        modelview = initialmodelview;
        modelview = mult(modelview, rotate(wheelRotation[1], 0, 1, 0));

        modelview = mult(modelview, translate(projectionCAM[0] - 37.5, projectionCAM[1] - 14, projectionCAM[2] - 12.9));
        modelview = mult(modelview, rotate(90.0, 0, 1, 90));
        modelview = mult(modelview, rotate(-wheelRotation[2], 1, 0, 0));
        modelview = mult(modelview, rotate(wheelRotation[0], 0, 0, 1));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling

        materialDiffuse = vec4(0, 0.2, 0.3, 1.0);
        diffuseProduct = mult(lightDiffuse, materialDiffuse);
        gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));

        modelview = mult(modelview, scale(1, 1, 0.2));
        cylinder.render();

        //  now, draw cylinder model Tire

        // associate texture to "texture unit" 0
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, tireTexID);

        // Send texture number to sampler
        gl.uniform1i(textureLoc, 2);
        // assign "0" to renderingoption in fragment shader (texture and Phong model)
        gl.uniform1i(renderingoptionLoc, 1);


        modelview = initialmodelview;
        modelview = mult(modelview, rotate(wheelRotation[1], 0, 1, 0));

        modelview = mult(modelview, translate(projectionCAM[0] + 12.5, projectionCAM[1] - 14, projectionCAM[2] + 15));
        modelview = mult(modelview, rotate(90.0, 0, 1, 90));
        // modelview = mult(modelview, rotate(wheelRotation[1], 1, 0, 0));
        modelview = mult(modelview, rotate(wheelRotation[0], 0, 0, 1));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling

        materialDiffuse = vec4(0, 0.2, 0.3, 1.0);
        diffuseProduct = mult(lightDiffuse, materialDiffuse);
        gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));

        modelview = mult(modelview, scale(1.1, 1.1, 0.6));
        cylinder.render();

        modelview = initialmodelview;
        modelview = mult(modelview, rotate(wheelRotation[1], 0, 1, 0));

        modelview = mult(modelview, translate(projectionCAM[0] - 37.5, projectionCAM[1] - 14, projectionCAM[2] + 15));
        modelview = mult(modelview, rotate(90.0, 0, 1, 90));
        modelview = mult(modelview, rotate(-wheelRotation[2], 1, 0, 0));
        modelview = mult(modelview, rotate(wheelRotation[0], 0, 0, 1));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling

        materialDiffuse = vec4(0, 0.2, 0.3, 1.0);
        diffuseProduct = mult(lightDiffuse, materialDiffuse);
        gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));

        modelview = mult(modelview, scale(1.1, 1.1, 0.6));
        cylinder.render();

        modelview = initialmodelview;
        modelview = mult(modelview, rotate(wheelRotation[1], 0, 1, 0));

        modelview = mult(modelview, translate(projectionCAM[0] + 12.5, projectionCAM[1] - 14, projectionCAM[2] - 15));
        modelview = mult(modelview, rotate(90.0, 0, 1, 90));
        // modelview = mult(modelview, rotate(wheelRotation[1], 1, 0, 0));
        modelview = mult(modelview, rotate(-wheelRotation[0], 0, 0, 1));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling

        materialDiffuse = vec4(0, 0.2, 0.3, 1.0);
        diffuseProduct = mult(lightDiffuse, materialDiffuse);
        gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));

        modelview = mult(modelview, scale(1.1, 1.1, 0.6));
        cylinder.render();

        modelview = initialmodelview;
        modelview = mult(modelview, rotate(wheelRotation[1], 0, 1, 0));

        modelview = mult(modelview, translate(projectionCAM[0] - 37.5, projectionCAM[1] - 14, projectionCAM[2] - 15));
        modelview = mult(modelview, rotate(90.0, 0, 1, 90));
        modelview = mult(modelview, rotate(-wheelRotation[2], 1, 0, 0));
        modelview = mult(modelview, rotate(wheelRotation[0], 0, 0, 1));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling

        materialDiffuse = vec4(0, 0.2, 0.3, 1.0);
        diffuseProduct = mult(lightDiffuse, materialDiffuse);
        gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));

        modelview = mult(modelview, scale(1.1, 1.1, 0.6));
        cylinder.render();

        gl.uniform1i(renderingoptionLoc, 0);


        // //  now, draw faces models
        modelview = initialmodelview;        
        modelview = mult(modelview, rotate(wheelRotation[1], 0, 1, 0));
        
        modelview = mult(modelview, translate(projectionCAM[0], projectionCAM[1], projectionCAM[2]));
        modelview = mult(modelview, rotate(0.0, 1, 0, 0));
        normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
        modelview = mult(modelview, scale(0.5, 0.5, 0.5));

        // face.render(); CAR render
        for (let i = 0; i < face.length; i++) {
            if (i == windowemp - 1) {
                // Windows top
                gl.activeTexture(gl.TEXTURE3);
                gl.bindTexture(gl.TEXTURE_2D, windowsTopTexID);

                // Send texture number to sampler
                gl.uniform1i(textureLoc, 3);
                // assign "0" to renderingoption in fragment shader (texture and Phong model)
                gl.uniform1i(renderingoptionLoc, 2);
            } else if (i == windowemp - 2) {
                // Windows down
                gl.activeTexture(gl.TEXTURE4);
                gl.bindTexture(gl.TEXTURE_2D, windowsDownTexID);

                // Send texture number to sampler
                gl.uniform1i(textureLoc, 4);
                // assign "0" to renderingoption in fragment shader (texture and Phong model)
                gl.uniform1i(renderingoptionLoc, 2);
            } else if (i == windowemp + 1) {
                // Windows Lat
                gl.activeTexture(gl.TEXTURE8);
                gl.bindTexture(gl.TEXTURE_2D, windowsLatTexID);

                // Send texture number to sampler
                gl.uniform1i(textureLoc, 8);
                // assign "0" to renderingoption in fragment shader (texture and Phong model)
                gl.uniform1i(renderingoptionLoc, 2);
            } else if (i == windowemp + 3 || i == windowemp) {
                // Windows Latdown
                gl.activeTexture(gl.TEXTURE9);
                gl.bindTexture(gl.TEXTURE_2D, windowsLat2TexID);

                // Send texture number to sampler
                gl.uniform1i(textureLoc, 9);
                // assign "0" to renderingoption in fragment shader (texture and Phong model)
                gl.uniform1i(renderingoptionLoc, 2);
            } else if (i == windowemp + 2 || i == windowemp - 3) {
                // Windows LatTop
                gl.activeTexture(gl.TEXTURE10);
                gl.bindTexture(gl.TEXTURE_2D, windowsLat3TexID);

                // Send texture number to sampler
                gl.uniform1i(textureLoc, 10);
                // assign "0" to renderingoption in fragment shader (texture and Phong model)
                gl.uniform1i(renderingoptionLoc, 2);
            } else if (i == plaqueemp - 1) {
                // Plaque left
                gl.activeTexture(gl.TEXTURE5);
                gl.bindTexture(gl.TEXTURE_2D, plaqueLeftTexID);

                // Send texture number to sampler
                gl.uniform1i(textureLoc, 5);
                // assign "0" to renderingoption in fragment shader (texture and Phong model)
                gl.uniform1i(renderingoptionLoc, 2);
            } else if (i == plaqueemp - 2) {
                // Plaque Right
                gl.activeTexture(gl.TEXTURE6);
                gl.bindTexture(gl.TEXTURE_2D, plaqueRightTexID);

                // Send texture number to sampler
                gl.uniform1i(textureLoc, 6);
                // assign "0" to renderingoption in fragment shader (texture and Phong model)
                gl.uniform1i(renderingoptionLoc, 2);
            }
            else {
                gl.uniform1i(renderingoptionLoc, 0);
            }


            if (i < ColorWhite) {
                materialDiffuse = vec4(1, 1, 1, 1.0);
                diffuseProduct = mult(lightDiffuse, materialDiffuse);
                gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));
                var materialAmbient = vec4(0.0, 0.1, 0.3, 1.0);
                var lightAmbient = vec4(1.0, 1.0, 1.0, 1.0);
                ambientProduct = mult(lightAmbient, materialAmbient);
                gl.uniform4fv(gl.getUniformLocation(prog, "ambientProduct"), flatten(ambientProduct));
            }
            else if (i < ColorBlack) {
                materialDiffuse = vec4(0, 0, 0, 1.0);
                diffuseProduct = mult(lightDiffuse, materialDiffuse);
                gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));
                var materialAmbient = vec4(0.0, 0.1, 0.3, 1.0);
                var lightAmbient = vec4(1.0, 1.0, 1.0, 1.0);
                ambientProduct = mult(lightAmbient, materialAmbient);
                gl.uniform4fv(gl.getUniformLocation(prog, "ambientProduct"), flatten(ambientProduct));
            }
            else if (i < ColorBlue) {
                materialDiffuse = vec4(0.2, 0.7, 1, 1.0);
                diffuseProduct = mult(lightDiffuse, materialDiffuse);
                gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));
                var materialAmbient = vec4(0.0, 0.1, 0.3, 1.0);
                var lightAmbient = vec4(1.0, 1.0, 1.0, 1.0);
                ambientProduct = mult(lightAmbient, materialAmbient);
                gl.uniform4fv(gl.getUniformLocation(prog, "ambientProduct"), flatten(ambientProduct));
            }
            else if (i < ColorYellow) {
                materialDiffuse = vec4(1., 0.835, 0.169);
                diffuseProduct = mult(lightDiffuse, materialDiffuse);
                gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));
                var materialAmbient = vec4(1., 0.835, 0.169, 0);
                var lightAmbient = vec4(1.0, 1.0, 1.0, 1.0);
                ambientProduct = mult(lightAmbient, materialAmbient);
                gl.uniform4fv(gl.getUniformLocation(prog, "ambientProduct"), flatten(ambientProduct));
            }
            else if (i < ColorGrey) {
                materialDiffuse = vec4(0.1, 0.4, 0.6);
                diffuseProduct = mult(lightDiffuse, materialDiffuse);
                gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));
                var materialAmbient = vec4(0.0, 0.1, 0.3, 1.0);
                var lightAmbient = vec4(1.0, 1.0, 1.0, 1.0);
                ambientProduct = mult(lightAmbient, materialAmbient);
                gl.uniform4fv(gl.getUniformLocation(prog, "ambientProduct"), flatten(ambientProduct));
            }

            face[i].render();
        }
    
        //  now, "object" model
		modelview = initialmodelview;
        modelview = mult(modelview, translate(projectionCAM[0] + 30, projectionCAM[1] - 10, projectionCAM[2] - 5));

        modelview = mult(modelview, rotate(wheelRotation[1], 0, 1, 0));
		modelview = mult(modelview, rotate(120.0, 0, 1, 0));
		modelview = mult(modelview, translate(-100.0, -25.0, -500.0));
		normalMatrix = extractNormalMatrix(modelview);  // always extract the normal matrix before scaling
		object.render();

    }

}



function unflatten(matrix) {
    var result = mat4();
    result[0][0] = matrix[0]; result[1][0] = matrix[1]; result[2][0] = matrix[2]; result[3][0] = matrix[3];
    result[0][1] = matrix[4]; result[1][1] = matrix[5]; result[2][1] = matrix[6]; result[3][1] = matrix[7];
    result[0][2] = matrix[8]; result[1][2] = matrix[9]; result[2][2] = matrix[10]; result[3][2] = matrix[11];
    result[0][3] = matrix[12]; result[1][3] = matrix[13]; result[2][3] = matrix[14]; result[3][3] = matrix[15];

    return result;
}

function extractNormalMatrix(matrix) { // This function computes the transpose of the inverse of 
    // the upperleft part (3X3) of the modelview matrix (see http://www.lighthouse3d.com/tutorials/glsl-tutorial/the-normal-matrix/ )

    var result = mat3();
    var upperleft = mat3();
    var tmp = mat3();

    upperleft[0][0] = matrix[0][0];  // if no scaling is performed, one can simply use the upper left
    upperleft[1][0] = matrix[1][0];  // part (3X3) of the modelview matrix
    upperleft[2][0] = matrix[2][0];

    upperleft[0][1] = matrix[0][1];
    upperleft[1][1] = matrix[1][1];
    upperleft[2][1] = matrix[2][1];

    upperleft[0][2] = matrix[0][2];
    upperleft[1][2] = matrix[1][2];
    upperleft[2][2] = matrix[2][2];

    tmp = matrixinvert(upperleft);
    result = transpose(tmp);

    return result;
}

function matrixinvert(matrix) {

    var result = mat3();

    var det = matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[2][1] * matrix[1][2]) -
        matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]) +
        matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0]);

    var invdet = 1 / det;

    // inverse of matrix m
    result[0][0] = (matrix[1][1] * matrix[2][2] - matrix[2][1] * matrix[1][2]) * invdet;
    result[0][1] = (matrix[0][2] * matrix[2][1] - matrix[0][1] * matrix[2][2]) * invdet;
    result[0][2] = (matrix[0][1] * matrix[1][2] - matrix[0][2] * matrix[1][1]) * invdet;
    result[1][0] = (matrix[1][2] * matrix[2][0] - matrix[1][0] * matrix[2][2]) * invdet;
    result[1][1] = (matrix[0][0] * matrix[2][2] - matrix[0][2] * matrix[2][0]) * invdet;
    result[1][2] = (matrix[1][0] * matrix[0][2] - matrix[0][0] * matrix[1][2]) * invdet;
    result[2][0] = (matrix[1][0] * matrix[2][1] - matrix[2][0] * matrix[1][1]) * invdet;
    result[2][1] = (matrix[2][0] * matrix[0][1] - matrix[0][0] * matrix[2][1]) * invdet;
    result[2][2] = (matrix[0][0] * matrix[1][1] - matrix[1][0] * matrix[0][1]) * invdet;

    return result;
}

function handleLoadedTexture(texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);

    ntextures_loaded++;
    render();  // Call render function when the image has been loaded (to make sure the model is displayed)
    setInterval(() => {
        wheelRotation[0]++
        render()
    }, 100);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

function handleLoadedTextureMap(texture) {

    ct++;
    if (ct == 6) {
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        var targets = [
            gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
            gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
            gl.TEXTURE_CUBE_MAP_POSITIVE_Z, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
        ];
        for (var j = 0; j < 6; j++) {
            gl.texImage2D(targets[j], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img[j]);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    }
    ntextures_loaded++;
    render();  // Call render function when the image has been loaded (to make sure the model is displayed)
}

function handleLoadedTextureFromObjFile(texturelist,Id) {
    gl.bindTexture(gl.TEXTURE_2D, texturelist[Id]);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texturelist[Id].image);
	gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR );

	ntextures_loaded++;
    render();  // Call render function when the image has been loaded (to insure the model is displayed)

    gl.bindTexture(gl.TEXTURE_2D, null);
}

function initTexture() {
    //UV Checker
    testTexID = gl.createTexture();

    testTexID.image = new Image();
    testTexID.image.onload = function () {
        handleLoadedTexture(testTexID)
    }
    testTexID.image.src = testLink;
    ntextures_tobeloaded++;

    //Wheel
    wheelTexID = gl.createTexture();

    wheelTexID.image = new Image();
    wheelTexID.image.onload = function () {
        handleLoadedTexture(wheelTexID)
    }
    wheelTexID.image.src = wheelLink;
    ntextures_tobeloaded++;

    //Wheel inside
    wheelinsideTexID = gl.createTexture();

    wheelinsideTexID.image = new Image();
    wheelinsideTexID.image.onload = function () {
        handleLoadedTexture(wheelinsideTexID)
    }
    wheelinsideTexID.image.src = wheelinsideLink;
    ntextures_tobeloaded++;

    //Tire
    tireTexID = gl.createTexture();

    tireTexID.image = new Image();
    tireTexID.image.onload = function () {
        handleLoadedTexture(tireTexID)
    }
    tireTexID.image.src = tireLink;
    ntextures_tobeloaded++;

    //Windows Top
    windowsTopTexID = gl.createTexture();

    windowsTopTexID.image = new Image();
    windowsTopTexID.image.onload = function () {
        handleLoadedTexture(windowsTopTexID)
    }
    windowsTopTexID.image.src = windowsTopLink;
    ntextures_tobeloaded++;

    //Windows Down
    windowsDownTexID = gl.createTexture();

    windowsDownTexID.image = new Image();
    windowsDownTexID.image.onload = function () {
        handleLoadedTexture(windowsDownTexID)
    }
    windowsDownTexID.image.src = windowsDownLink;
    ntextures_tobeloaded++;

    //Windows Lateral
    windowsLatTexID = gl.createTexture();

    windowsLatTexID.image = new Image();
    windowsLatTexID.image.onload = function () {
        handleLoadedTexture(windowsLatTexID)
    }
    windowsLatTexID.image.src = windowsLatLink;
    ntextures_tobeloaded++;

    //Windows Lateral 2
    windowsLat2TexID = gl.createTexture();

    windowsLat2TexID.image = new Image();
    windowsLat2TexID.image.onload = function () {
        handleLoadedTexture(windowsLat2TexID)
    }
    windowsLat2TexID.image.src = windowsLat2Link;
    ntextures_tobeloaded++;

    //Windows Lateral 3
    windowsLat3TexID = gl.createTexture();

    windowsLat3TexID.image = new Image();
    windowsLat3TexID.image.onload = function () {
        handleLoadedTexture(windowsLat3TexID)
    }
    windowsLat3TexID.image.src = windowsLat3Link;
    ntextures_tobeloaded++;

    //Plaque Left
    plaqueLeftTexID = gl.createTexture();

    plaqueLeftTexID.image = new Image();
    plaqueLeftTexID.image.onload = function () {
        handleLoadedTexture(plaqueLeftTexID)
    }
    plaqueLeftTexID.image.src = plaqueLeftLink;
    ntextures_tobeloaded++;

    //Plaque Right
    plaqueRightTexID = gl.createTexture();

    plaqueRightTexID.image = new Image();
    plaqueRightTexID.image.onload = function () {
        handleLoadedTexture(plaqueRightTexID)
    }
    plaqueRightTexID.image.src = plaqueRightLink;
    ntextures_tobeloaded++;

    //Phare
    phareTexID = gl.createTexture();

    phareTexID.image = new Image();
    phareTexID.image.onload = function () {
        handleLoadedTexture(phareTexID)
    }
    phareTexID.image.src = phareLink;
    ntextures_tobeloaded++;

    //Steel
    steelTexID = gl.createTexture();

    steelTexID.image = new Image();
    steelTexID.image.onload = function () {
        handleLoadedTexture(steelTexID)
    }
    steelTexID.image.src = steelLink;
    ntextures_tobeloaded++;

    var urls = [
        "Texture/px.png", "Texture/nx.png",
        "Texture/py.png", "Texture/ny.png",
        "Texture/pz.png", "Texture/nz.png"
    ];

    texIDmap0 = gl.createTexture();

    for (var i = 0; i < 6; i++) {
        img[i] = new Image();
        img[i].onload = function () {  // this function is called when the image download is complete

            handleLoadedTextureMap(texIDmap0);
        }
        img[i].src = urls[i];   // this line starts the image downloading thread
        ntextures_tobeloaded++;

    }

    //Soccer
    soccerTexID = gl.createTexture();

    soccerTexID.image = new Image();
    soccerTexID.image.onload = function () {
        handleLoadedTexture(soccerTexID)
    }
    soccerTexID.image.src = soccerLink;
    ntextures_tobeloaded++;

    //Basket
    basketTexID = gl.createTexture();

    basketTexID.image = new Image();
    basketTexID.image.onload = function () {
        handleLoadedTexture(basketTexID)
    }
    basketTexID.image.src = basketLink;
    ntextures_tobeloaded++;
}


// The following function is used to create an "object" (called "model") containing all the informations needed
// to draw a particular element (sphere, cylinder, cube,...). 
// Note that the function "model.render" is defined inside "createModel" but it is NOT executed.
// That function is only executed when we call it explicitly in render().

function createModel(modelData) {
    var model = {};
    model.coordsBuffer = gl.createBuffer();
    model.normalBuffer = gl.createBuffer();
    model.textureBuffer = gl.createBuffer();
    model.indexBuffer = gl.createBuffer();
    model.count = modelData.indices.length;

    gl.bindBuffer(gl.ARRAY_BUFFER, model.coordsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexPositions, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexNormals, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, model.textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexTextureCoords, gl.STATIC_DRAW);

    // console.log(modelData.vertexPositions.length);
    // console.log(modelData.indices.length);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, modelData.indices, gl.STATIC_DRAW);

    model.render = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.coordsBuffer);
        gl.vertexAttribPointer(vcoordsLoc, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(vnormalLoc, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
        gl.vertexAttribPointer(vtexcoordLoc, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        gl.uniformMatrix4fv(modelviewLoc, false, flatten(modelview));    //--- load flattened modelview matrix
        gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix));  //--- load flattened normal matrix

        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
        // console.log(this.count);
    }
    return model;
}

function createModelmap(modelData) {
    var model = {};
    model.coordsBuffer = gl.createBuffer();
    model.normalBuffer = gl.createBuffer();
    model.indexBuffer = gl.createBuffer();
    model.count = modelData.indices.length;

    gl.bindBuffer(gl.ARRAY_BUFFER, model.coordsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexPositions, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexNormals, gl.STATIC_DRAW);

    // console.log(modelData.vertexPositions.length);
    // console.log(modelData.indices.length);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, modelData.indices, gl.STATIC_DRAW);

    model.render = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.coordsBuffer);
        gl.vertexAttribPointer(vcoordsmapLoc, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(vnormalmapLoc, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        gl.uniformMatrix4fv(modelviewmapLoc, false, flatten(modelview));    //--- load flattened modelview matrix
        gl.uniformMatrix3fv(normalMatrixmapLoc, false, flatten(normalMatrix));  //--- load flattened normal matrix

        gl.uniformMatrix3fv(minvmapLoc, false, flatten(Minv));  // send matrix inverse of modelview in order to rotate the skybox

        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
        // console.log(this.count);
    }
    return model;
}


function createModelbox(modelData) {  // For creating the environment box.
    var model = {};
    model.coordsBuffer = gl.createBuffer();
    model.indexBuffer = gl.createBuffer();
    model.count = modelData.indices.length;
    gl.bindBuffer(gl.ARRAY_BUFFER, model.coordsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexPositions, gl.STATIC_DRAW);
    // console.log(modelData.vertexPositions.length);
    // console.log(modelData.indices.length);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, modelData.indices, gl.STATIC_DRAW);
    model.render = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.coordsBuffer);
        gl.vertexAttribPointer(vcoordsboxLoc, 3, gl.FLOAT, false, 0, 0);
        gl.uniformMatrix4fv(modelviewboxLoc, false, flatten(modelview));
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    }
    return model;
}

function createModelFromObjFile(ptr) {
	
	var i;
    var model = {};
	
	model.numberofelements = ptr.numberofelements;
	model.coordsBuffer = [];
	model.normalBuffer = [];
	model.textureBuffer = [];
	model.indexBuffer = [];
	model.count = [];
	model.Ka = [];
	model.Kd = [];
	model.Ks = [];
	model.Ns = [];
	model.textureFile = [];
	model.texId = [];

	
	for(i=0; i < ptr.numberofelements; i++){
	
		model.coordsBuffer.push( gl.createBuffer() );
		model.normalBuffer.push( gl.createBuffer() );
		model.textureBuffer.push( gl.createBuffer() );
		model.indexBuffer.push( gl.createBuffer() );
		model.count.push( ptr.list[i].indices.length );
	
		gl.bindBuffer(gl.ARRAY_BUFFER, model.coordsBuffer[i]);
		gl.bufferData(gl.ARRAY_BUFFER, ptr.list[i].vertexPositions, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer[i]);
		gl.bufferData(gl.ARRAY_BUFFER, ptr.list[i].vertexNormals, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, model.textureBuffer[i]);
		gl.bufferData(gl.ARRAY_BUFFER, ptr.list[i].vertexTextureCoords, gl.STATIC_DRAW);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer[i]);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ptr.list[i].indices, gl.STATIC_DRAW);
		
		model.Ka.push(ptr.list[i].material.Ka);
		model.Kd.push(ptr.list[i].material.Kd);
		model.Ks.push(ptr.list[i].material.Ks);
		model.Ns.push(ptr.list[i].material.Ns);  // shininess

		// if a texture file has been defined for this element
		if(ptr.list[i].material.map != ""){
			
			// Check if the filename is present in the texture list
			var texindex = model.textureFile.indexOf(ptr.list[i].material.map);
			if( texindex > -1){ // texture file previously loaded
				// store the texId of the previously loaded file
				model.texId.push(model.texId[texindex]);
			}
			else { // new texture file to load
				// store current texture counter (will be used when rendering the scene)
				model.texId.push(texcounter);
			
				// add a new image buffer to the texture list
				texturelist.push(gl.createTexture());
				if(texcounter < 70){
					texturelist[texcounter].image = new Image();
					
					if(texcounter == 0){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,0)
						}
					}
					else if(texcounter == 1){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,1)
						}
					}
					else if(texcounter == 2){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,2)
						}
					}
					else if(texcounter == 3){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,3)
						}
					}
					else if(texcounter == 4){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,4)
						}
					}
					else if(texcounter == 5){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,5)
						}
					}
					else if(texcounter == 6){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,6)
						}
					}
					else if(texcounter == 7){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,7)
						}
					}
					else if(texcounter == 8){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,8)
						}
					}
					else if(texcounter == 9){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,9)
						}
					}
					else if(texcounter == 10){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,10)
						}
					}
					else if(texcounter == 11){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,11)
						}
					}
					else if(texcounter == 12){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,12)
						}
					}
					else if(texcounter == 13){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,13)
						}
					}
					else if(texcounter == 14){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,14)
						}
					}
					else if(texcounter == 15){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,15)
						}
					}
					else if(texcounter == 16){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,16)
						}
					}
					else if(texcounter == 17){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,17)
						}
					}
					else if(texcounter == 18){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,18)
						}
					}
					else if(texcounter == 19){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,19)
						}
					}
					else if(texcounter == 20){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,20)
						}
					}
					else if(texcounter == 21){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,21)
						}
					}
					else if(texcounter == 22){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,22)
						}
					}
					else if(texcounter == 23){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,23)
						}
					}
					else if(texcounter == 24){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,24)
						}
					}
					else if(texcounter == 25){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,25)
						}
					}
					else if(texcounter == 26){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,26)
						}
					}
					else if(texcounter == 27){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,27)
						}
					}
					else if(texcounter == 28){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,28)
						}
					}
					else if(texcounter == 29){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,29)
						}
					}
					else if(texcounter == 30){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,30)
						}
					}
					else if(texcounter == 31){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,31)
						}
					}
					else if(texcounter == 32){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,32)
						}
					}
					else if(texcounter == 33){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,33)
						}
					}
					else if(texcounter == 34){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,34)
						}
					}
					else if(texcounter == 35){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,35)
						}
					}
					else if(texcounter == 36){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,36)
						}
					}
					else if(texcounter == 37){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,37)
						}
					}
					else if(texcounter == 38){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,38)
						}
					}
					else if(texcounter == 39){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,39)
						}
					}
					else if(texcounter == 40){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,40)
						}
					}
					else if(texcounter == 41){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,41)
						}
					}
					else if(texcounter == 42){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,42)
						}
					}
					else if(texcounter == 43){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,43)
						}
					}
					else if(texcounter == 44){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,44)
						}
					}
					else if(texcounter == 45){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,45)
						}
					}
					else if(texcounter == 46){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,46)
						}
					}
					else if(texcounter == 47){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,47)
						}
					}
					else if(texcounter == 48){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,48)
						}
					}
					else if(texcounter == 49){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,49)
						}
					}
					else if(texcounter == 50){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,50)
						}
					}
					else if(texcounter == 51){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,51)
						}
					}
					else if(texcounter == 52){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,52)
						}
					}
					else if(texcounter == 53){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,53)
						}
					}
					else if(texcounter == 54){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,54)
						}
					}
					else if(texcounter == 55){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,55)
						}
					}
					else if(texcounter == 56){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,56)
						}
					}
					else if(texcounter == 57){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,57)
						}
					}
					else if(texcounter == 58){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,58)
						}
					}
					else if(texcounter == 59){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,59)
						}
					}
					else if(texcounter == 60){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,60)
						}
					}
					else if(texcounter == 61){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,61)
						}
					}
					else if(texcounter == 62){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,62)
						}
					}
					else if(texcounter == 63){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,63)
						}
					}
					else if(texcounter == 64){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,64)
						}
					}
					else if(texcounter == 65){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,65)
						}
					}
					else if(texcounter == 66){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,66)
						}
					}
					else if(texcounter == 67){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,67)
						}
					}
					else if(texcounter == 68){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,68)
						}
					}
					else if(texcounter == 69){  // associate a FIXED callback function to each texture Id
						texturelist[texcounter].image.onload = function () {
							handleLoadedTextureFromObjFile(texturelist,69)
						}
					}
					
					if(texcounter < 70){
						texturelist[texcounter].image.src = ptr.list[i].material.map;
						ntextures_tobeloaded++;					
					}

					// increment counter
					texcounter ++;
				} // if(texcounter<70)
			} // else				
		} // if(ptr.list[i].material.map != ""){
		else { // if there is no texture file associated to this element
			// store a null value (it will NOT be used when rendering the scene)
			model.texId.push(null);
		}
			
		// store the filename for every element even if it is empty ("")
		model.textureFile.push(ptr.list[i].material.map);		
		
	} // for(i=0; i < ptr.numberofelements; i++){
	
	model.render = function () {
		for(i=0; i < this.numberofelements; i++){
			
			gl.bindBuffer(gl.ARRAY_BUFFER, this.coordsBuffer[i]);
			gl.vertexAttribPointer(vcoordsLoc, 3, gl.FLOAT, false, 0, 0);
			gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer[i]);
			gl.vertexAttribPointer(vnormalLoc, 3, gl.FLOAT, false, 0, 0);
			gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer[i]);
			gl.vertexAttribPointer(vtexcoordLoc, 2, gl.FLOAT, false, 0, 0);

			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer[i]);

			gl.uniformMatrix4fv(modelviewLoc, false, flatten(modelview));    //--- load flattened modelview matrix
			gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix));  //--- load flattened normal matrix

			ambientProduct = mult(lightAmbient, vec4(this.Ka[i],1.0));
			diffuseProduct = mult(lightDiffuse, vec4(this.Kd[i],1.0));
			specularProduct = mult(lightSpecular, vec4(this.Ks[i],1.0));
			materialShininess = this.Ns[i];

            gl.uniform4fv(gl.getUniformLocation(prog, "ambientProduct"), flatten(ambientProduct));
            gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));
            gl.uniform4fv(gl.getUniformLocation(prog, "specularProduct"), flatten(specularProduct));
            gl.uniform1f(gl.getUniformLocation(prog, "shininess"), materialShininess);

			if(this.textureFile[i] != ""){
				gl.enableVertexAttribArray(vtexcoordLoc);				
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, texturelist[model.texId[i]]);
			
				// Send texture number to sampler
				gl.uniform1i(textureLoc, 0);
				
				// assign "2" to renderingoption in fragment shader
				gl.uniform1i(renderingoptionLoc, 2);
			}
			else{
				gl.disableVertexAttribArray(vtexcoordLoc);
				// assign "0" to renderingoption in fragment shader
				gl.uniform1i(renderingoptionLoc, 0);		
                		
			}
			
			gl.drawElements(gl.TRIANGLES, this.count[i], gl.UNSIGNED_SHORT, 0);
		}
	}
	
    return model;
}


function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
    var vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vertexShaderSource);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw "Error in vertex shader:  " + gl.getShaderInfoLog(vsh);
    }
    var fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fragmentShaderSource);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw "Error in fragment shader:  " + gl.getShaderInfoLog(fsh);
    }
    var prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw "Link error in program:  " + gl.getProgramInfoLog(prog);
    }
    return prog;
}


function getTextContent(elementID) {
    var element = document.getElementById(elementID);
    var fsource = "";
    var node = element.firstChild;
    var str = "";
    while (node) {
        if (node.nodeType == 3) // this is a text node
            str += node.textContent;
        node = node.nextSibling;
    }
    return str;
}


window.onload = function init() {
    try {
        canvas = document.getElementById("glcanvas");
        gl = canvas.getContext("webgl");
        if (!gl) {
            gl = canvas.getContext("experimental-webgl");
        }
        if (!gl) {
            throw "Could not create WebGL context.";
        }

        // LOAD FIRST SHADER  (environmental mapping)
        var vertexShaderSourcemap = getTextContent("vshadermap");
        var fragmentShaderSourcemap = getTextContent("fshadermap");
        progmap = createProgram(gl, vertexShaderSourcemap, fragmentShaderSourcemap);

        gl.useProgram(progmap);

        // locate variables for further use
        vcoordsmapLoc = gl.getAttribLocation(progmap, "vcoords");
        vnormalmapLoc = gl.getAttribLocation(progmap, "vnormal");
        vtexcoordmapLoc = gl.getAttribLocation(progmap, "vtexcoord");

        modelviewmapLoc = gl.getUniformLocation(progmap, "modelview");
        projectionmapLoc = gl.getUniformLocation(progmap, "projection");
        normalMatrixmapLoc = gl.getUniformLocation(progmap, "normalMatrix");
        minvmapLoc = gl.getUniformLocation(progmap, "minv");

        skyboxmapLoc = gl.getUniformLocation(progmap, "skybox");

        gl.enableVertexAttribArray(vcoordsmapLoc);
        gl.enableVertexAttribArray(vnormalmapLoc);
        gl.disableVertexAttribArray(vtexcoordmapLoc);   // texture coordinates not used (environmental mapping)

        // LOAD SECOND SHADER (standard texture mapping)
        var vertexShaderSource = getTextContent("vshader");
        var fragmentShaderSource = getTextContent("fshader");
        prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

        gl.useProgram(prog);

        // locate variables for further use
        vcoordsLoc = gl.getAttribLocation(prog, "vcoords");
        vnormalLoc = gl.getAttribLocation(prog, "vnormal");
        vtexcoordLoc = gl.getAttribLocation(prog, "vtexcoord");

        modelviewLoc = gl.getUniformLocation(prog, "modelview");
        projectionLoc = gl.getUniformLocation(prog, "projection");
        normalMatrixLoc = gl.getUniformLocation(prog, "normalMatrix");

        textureLoc = gl.getUniformLocation(prog, "texture");
        renderingoptionLoc = gl.getUniformLocation(prog, "renderingoption");

        gl.enableVertexAttribArray(vcoordsLoc);
        gl.enableVertexAttribArray(vnormalLoc);
        gl.enableVertexAttribArray(vtexcoordLoc);

        // LOAD THIRD SHADER (for the environment)
        var vertexShaderSource = getTextContent("vshaderbox");
        var fragmentShaderSource = getTextContent("fshaderbox");
        progbox = createProgram(gl, vertexShaderSource, fragmentShaderSource);

        gl.useProgram(progbox);

        vcoordsboxLoc = gl.getAttribLocation(progbox, "vcoords");
        vnormalboxLoc = gl.getAttribLocation(progbox, "vnormal");
        vtexcoordboxLoc = gl.getAttribLocation(progbox, "vtexcoord");

        modelviewboxLoc = gl.getUniformLocation(progbox, "modelview");
        projectionboxLoc = gl.getUniformLocation(progbox, "projection");

        skyboxLoc = gl.getUniformLocation(progbox, "skybox");

        gl.enable(gl.DEPTH_TEST);

        initTexture();

        //  create a "rotator" monitoring mouse mouvement
        rotator = new SimpleRotator(canvas, render);
        //  set initial camera position at z=40, with an "up" vector aligned with y axis
        //   (this defines the initial value of the modelview matrix )
        rotator.setView([1, 0, 0], [0, 1, 0], 80);

        ambientProduct = mult(lightAmbient, materialAmbient);
        diffuseProduct = mult(lightDiffuse, materialDiffuse);
        specularProduct = mult(lightSpecular, materialSpecular);

        gl.useProgram(prog);

        gl.uniform4fv(gl.getUniformLocation(prog, "ambientProduct"), flatten(ambientProduct));
        gl.uniform4fv(gl.getUniformLocation(prog, "diffuseProduct"), flatten(diffuseProduct));
        gl.uniform4fv(gl.getUniformLocation(prog, "specularProduct"), flatten(specularProduct));
        gl.uniform1f(gl.getUniformLocation(prog, "shininess"), materialShininess);

        gl.uniform4fv(gl.getUniformLocation(prog, "lightPosition"), flatten(lightPosition));

        projection = perspective(zoom, 1, 1, 200);
        gl.uniformMatrix4fv(projectionLoc, false, flatten(projection));  // send projection matrix to the shader program

        // In the following lines, we create different "elements" (sphere, cylinder, box, disk,...).
        // These elements are "objects" returned by the "createModel()" function.
        // The "createModel()" function requires one parameter which contains all the information needed
        // to create the "object". The functions "uvSphere()", "uvCylinder()", "cube()",... are described
        // in the file "basic-objects-IFS.js". They return an "object" containing vertices, normals, 
        // texture coordinates and indices.
        // 

        sphere = createModel(uvSphere(10.0, 25.0, 25.0));

        box = createModel(cube(1.0));

        mirrorObj = createModelmap(uvSphere(10.0, 25.0, 25.0));

        prism = createModel(prisme(6.0));

        cylinder = createModel(uvCylinder(7.0, 10.0, 25.0, false, false));

        object = createModelFromObjFile(ExtractDataFromOBJ("IronMan.obj"));  // Extract vertices and normals from OBJ file

        var facette

        face = [];

        // Carrosserie Blanche - - >
        facette = createModel(customface([-60, 0, 40], [-60, 5, 40], [35, 5, 40], [45, 0, 40])); face.push(facette);
        facette = createModel(customface([50, 0, 40], [50, -10, 40], [-60, -10, 40], [-60, 0, 40])); face.push(facette);
        facette = createModel(customface([50, 0, 40], [60, 0, 40], [60, -10, 40], [50, -10, 40])); face.push(facette);
        facette = createModel(customface([-60, -10, 40], [-105, -10, 40], [-100, 0, 40], [-60, 5, 40])); face.push(facette);
        facette = createModel(customface([-105, -10, 40], [-110, -10, 35], [-105, 0, 35], [-100, 0, 40])); face.push(facette);
        facette = createModel(customface([-105, 0, 35], [-60, 6, 35], [-60, 5, 40], [-100, 0, 40])); face.push(facette);
        facette = createModel(customface([-55, 16, 35], [-55, 15, 40], [-60, 5, 40], [-60, 6, 35])); face.push(facette);
        facette = createModel(customface([-45, 25, 40], [-55, 15, 40], [-55, 16, 35], [-45, 26, 35])); face.push(facette);
        facette = createModel(customface([-45, 25, 40], [-55, 15, 40], [-55, 16, 35], [-45, 26, 35])); face.push(facette);
        facette = createModel(customface([25, 16, 35], [25, 15, 40], [5, 25, 40], [5, 25, 35])); face.push(facette);
        facette = createModel(customface([50, 1, 35], [50, 0, 40], [25, 15, 40], [25, 16, 35])); face.push(facette);
        facette = createModel(customface([50, 1, 35], [60, 1, 35], [60, 0, 40], [50, 0, 40])); face.push(facette);
        facette = createModel(customface([60, 1, 35], [60, 1, 0], [60, -11, 0], [60, -11, 35])); face.push(facette);
        facette = createModel(customface([50, 1, 0], [60, 1, 0], [60, 1, 35], [50, 1, 35])); face.push(facette);
        facette = createModel(customface([-45, 26, 0], [5, 25, 0], [5, 25, 35], [-45, 26, 35])); face.push(facette);
        facette = createModel(customface([-105, 0, 0], [-60, 6, 0], [-60, 6, 35], [-105, 0, 35])); face.push(facette);
        facette = createModel(customface([-105, 0, 0], [-105, 0, 35], [-110, -10, 35], [-110, -10, 0])); face.push(facette);
        facette = createModel(customface([-45, 26, 35], [5, 25, 35], [5, 25, 40], [-45, 25, 40])); face.push(facette);
        facette = createModel(customface([-45, 25, 40], [-40, 25, 40], [-50, 15, 40], [-55, 15, 40])); face.push(facette);
        facette = createModel(customface([-45, 25, 40], [5, 25, 40], [5, 23, 40], [-45, 23, 40])); face.push(facette);
        facette = createModel(customface([-5, 25, 40], [5, 25, 40], [25, 15, 40], [15, 15, 40])); face.push(facette);
        facette = createModel(customface([-5, 5, 40], [-10, 5, 40], [-10, 23, 40], [-5, 23, 40])); face.push(facette);
        facette = createModel(customface([-58, 5, 40], [-60, 5, 40], [-55, 15, 40], [-50, 15, 40])); face.push(facette);
        facette = createModel(customface([25, 15, 40], [50, 0, 40], [40, 0, 40], [15, 15, 40])); face.push(facette);
        facette = createModel(customface([-58, 5, 40], [-60, 5, 40], [-57, 10, 40], [-54, 10, 40])); face.push(facette);
        facette = createModel(customface([-58, 5, 40], [-60, 5, 40], [-57, 5, 45], [-54, 5, 45])); face.push(facette);
        facette = createModel(customface([-54, 10, 45], [-50, 10, 45], [-54, 5, 45], [-57, 5, 45])); face.push(facette);
        facette = createModel(customface([-50, 10, 45], [-54, 10, 45], [-57, 10, 40], [-54, 10, 40])); face.push(facette);
        facette = createModel(customface([-57, 5, 45], [-60, 5, 40], [-57, 10, 40], [-54, 10, 45])); face.push(facette);
        //Plaque
        facette = createModel(customface([-110, -10, 5], [-110, -10, 10], [-105, -18, 10], [-105, -18, 5])); face.push(facette);
        facette = createModel(customface([-110, -10, 0], [-110, -10, 5], [-105, -18, 5], [-105, -18, 0])); face.push(facette);
        plaqueemp = face.length;

        ColorWhite = face.length;

        // Carrosserie Noire - - >
        facette = createModel(customface([50, -10, 40], [60, -10, 40], [58, -20, 40], [40, -25, 40])); face.push(facette);
        facette = createModel(customface([35, -15, 40], [50, -10, 40], [40, -25, 40], [35, -15, 40])); face.push(facette);
        facette = createModel(customface([25, -12, 40], [25, -10, 40], [50, -10, 40], [35, -15, 40])); face.push(facette);
        facette = createModel(customface([15, -15, 40], [5, -10, 40], [25, -10, 40], [25, -12, 40])); face.push(facette);
        facette = createModel(customface([10, -25, 40], [5, -25, 40], [5, -10, 40], [15, -15, 40])); face.push(facette);
        facette = createModel(customface([40, -25, 40], [40, -25, 20], [35, -15, 20], [35, -15, 40])); face.push(facette);
        facette = createModel(customface([35, -15, 40], [35, -15, 20], [25, -10, 20], [25, -10, 40])); face.push(facette);
        facette = createModel(customface([25, -10, 40], [25, -10, 20], [15, -15, 20], [15, -15, 40])); face.push(facette);
        facette = createModel(customface([15, -15, 40], [15, -15, 20], [10, -25, 20], [10, -25, 40])); face.push(facette);
        facette = createModel(customface([35, -15, 20], [40, -25, 20], [10, -25, 20], [15, -15, 20])); face.push(facette);
        facette = createModel(customface([15, -15, 20], [25, -10, 20], [35, -15, 20], [35, -15, 20])); face.push(facette);
        facette = createModel(customface([-60, -10, 40], [5, -10, 40], [5, -25, 40], [-60, -25, 40])); face.push(facette);
        facette = createModel(customface([-60, -25, 40], [-65, -15, 40], [-60, -10, 40], [-60, -10, 40])); face.push(facette);
        facette = createModel(customface([-70, -10, 40], [-60, -10, 40], [-65, -15, 40], [-70, -12, 40])); face.push(facette);
        facette = createModel(customface([-80, -12, 40], [-85, -15, 40], [-90, -10, 40], [-80, -10, 40])); face.push(facette);
        facette = createModel(customface([-80, -10, 40], [-70, -10, 40], [-70, -12, 40], [-80, -12, 40])); face.push(facette);
        facette = createModel(customface([-90, -10, 40], [-85, -15, 40], [-90, -25, 40], [-90, -10, 40])); face.push(facette);
        facette = createModel(customface([-90, -10, 40], [-90, -25, 40], [-100, -22, 40], [-105, -10, 40])); face.push(facette);
        facette = createModel(customface([-105, -10, 40], [-100, -22, 40], [-105, -18, 35], [-110, -10, 35])); face.push(facette);
        facette = createModel(customface([58, -20, 35], [58, -20, 40], [60, -10, 40], [60, -11, 35])); face.push(facette);
        facette = createModel(customface([60, -11, 35], [60, -11, 0], [58, -20, 0], [58, -20, 35])); face.push(facette);
        facette = createModel(customface([-110, -10, 35], [-105, -18, 35], [-105, -18, 10], [-110, -10, 10])); face.push(facette);
        facette = createModel(customface([-100, -22, 0], [-105, -18, 0], [-105, -18, 35], [-100, -22, 40])); face.push(facette);
        facette = createModel(customface([-100, -22, 40], [-90, -25, 40], [-90, -25, 0], [-100, -22, 0])); face.push(facette);
        facette = createModel(customface([-85, -15, 20], [-90, -25, 20], [-90, -25, 40], [-85, -15, 40])); face.push(facette);
        facette = createModel(customface([-85, -15, 40], [-80, -12, 40], [-80, -12, 20], [-85, -15, 20])); face.push(facette);
        facette = createModel(customface([-70, -12, 20], [-80, -12, 20], [-80, -12, 40], [-70, -12, 40])); face.push(facette);
        facette = createModel(customface([-70, -12, 40], [-65, -15, 40], [-65, -15, 20], [-70, -12, 20])); face.push(facette);
        facette = createModel(customface([-60, -25, 20], [-65, -15, 20], [-65, -15, 40], [-60, -25, 40])); face.push(facette);
        facette = createModel(customface([-85, -15, 20], [-65, -15, 20], [-60, -25, 20], [-90, -25, 20])); face.push(facette);
        facette = createModel(customface([-85, -15, 20], [-80, -12, 20], [-70, -12, 20], [-65, -15, 20])); face.push(facette);


        // Bas de caisse - - >
        facette = createModel(customface([10, -25, 0], [10, -25, 20], [40, -25, 20], [40, -25, 0])); face.push(facette);
        facette = createModel(customface([40, -25, 0], [40, -25, 35], [58, -20, 35], [58, -20, 0])); face.push(facette);
        facette = createModel(customface([58, -20, 40], [58, -20, 35], [40, -25, 35], [40, -25, 40])); face.push(facette);
        facette = createModel(customface([-90, -25, 0], [-90, -25, 20], [-60, -25, 20], [-60, -25, 0])); face.push(facette);
        facette = createModel(customface([-60, -25, 0], [-60, -25, 20], [10, -25, 20], [10, -25, 0])); face.push(facette);
        facette = createModel(customface([10, -25, 40], [10, -25, 20], [-60, -25, 20], [-60, -25, 40])); face.push(facette);


        ColorBlack = face.length;

        // Vitres - - >
        facette = createModel(customface([5, 25, 35], [5, 25, 0], [25, 16, 0], [25, 16, 35])); face.push(facette);
        // facette = createModel(customface([-55, 16, 35], [-60, 6, 35], [-60, 6, 0], [-55, 16, 0])); face.push(facette);
        // facette = createModel(customface([-45, 26, 35], [-55, 16, 35], [-55, 16, 0], [-45, 26, 0])); face.push(facette);
        facette = createModel(customface([-60, 6, 35], [-60, 6, 0], [-55, 16, 0], [-55, 16, 35])); face.push(facette);

        facette = createModel(customface([-55, 16, 35], [-55, 16, 0], [-45, 26, 0], [-45, 26, 35])); face.push(facette);

        windowemp = face.length;
        facette = createModel(customface([25, 16, 35], [25, 16, 0], [50, 1, 0], [50, 1, 35])); face.push(facette);

        facette = createModel(customface([34, 5, 40], [-5, 5, 40], [-5, 23, 40], [0, 23, 40], [0, 5, 1])); face.push(facette);
        facette = createModel(customface([-42, 23, 40], [-10, 23, 40], [-10, 15, 40], [-50, 15, 40], [0, 5, 1])); face.push(facette);
        facette = createModel(customface([-50, 15, 40], [-10, 15, 40], [-10, 5, 40], [-58, 5, 40], [0, 5, 1])); face.push(facette);


        ColorBlue = face.length;


        // Feu - - >
        facette = createModel(customface([60, -11, 35], [60, -10, 40], [60, 0, 40], [60, 1, 35])); face.push(facette);

        ColorYellow = face.length;

        // Rétroviseur
        facette = createModel(customface([-50, 10, 45], [-54, 10, 40], [-58, 5, 40], [-54, 5, 45])); face.push(facette);

        ColorGrey = face.length;

        envbox = createModelbox(cube(1000.0));

        var scrollableElement = document.body; //document.getElementById('scrollableElement');

        scrollableElement.addEventListener('wheel', checkScrollDirection);

        function checkScrollDirection(event) {
            if (checkScrollDirectionIsUp(event)) {
                projectionCAM[2] += 5;
            } else {
                projectionCAM[2] += -5;
                if (zoom <= 0) zoom = 0
            }
            // console.log(zoom)
            projection = perspective(zoom, 1.0, 1.0, 200.0);
            gl.uniformMatrix4fv(projectionLoc, false, flatten(projection));  // send projection matrix to the shader program

            render();
        }

        // function checkScrollDirectionIsUp(event) {
        //     if (event.wheelDelta) {
        //         return event.wheelDelta > 0;
        //     }
        //     return event.deltaY < 0;
        // }



        // managing arrow keys (to move up or down the model)
        document.onkeydown = function (e) {
            switch (e.key) {
                case 'Home':
                    // resize the canvas to the current window width and height
                    resize(canvas);
                    break;
                case 'q':
                    wheelRotation[1] += 1;
                    wheelRotation[2] += -1;
                    if (wheelRotation[2] > 15) {
                        wheelRotation[2] = 15
                    }
                    else{
                        projectionCAM[2] += -1;
                    }
                    
                    render();
                    break;
                case 'a':
                    wheelRotation[1] += 1;
                    wheelRotation[2] += -1;
                    if (wheelRotation[2] > 15) {
                        wheelRotation[2] = 15
                    }
                    else{
                        projectionCAM[2] += -1;
                    }
                    
                    
                    render();
                    break;
                case 'd':
                    wheelRotation[1] += -1;
                    wheelRotation[2] += -1;
                    if (wheelRotation[2] < -15) {
                        wheelRotation[2] = -15
                    }
                    else{
                        projectionCAM[2] += 1;
                    }
                    render();
                    break;
                case 'z':
                    phareRotation += -1
                    if (phareRotation < 0) {
                        phareRotation = 0
                    }
                    projectionCAM[0] += 1;
                    render();
                    break;
                case 's':
                    phareRotation += 1
                    if (phareRotation > 55) {
                        phareRotation = 55
                    }
                    projectionCAM[0] += -1;
                    render();
                    break;
                case 'w':
                    phareRotation += 1
                    if (phareRotation > 55) {
                        phareRotation = 55
                    }
                    projectionCAM[0] += -1;
                    render();
                    break;
                // case 't':
                // zoom += -10;
                // render();
                // break;
                // case 'g':
                // zoom += -10;
                // render();
                // break;
                default:
                    // console.log(e.key);
                    break;
            }
            render();

        };

    }
    catch (e) {
        document.getElementById("message").innerHTML =
            "Could not initialize WebGL: " + e;
        return;
    }

    window.addEventListener("resize", onresize);

    onresize();  // size the canvas to the current window width and height

    // setInterval(function () {
    //     var t = Math.floor(Math.random() * 5)
    //     ListMov.push(t);
    //     render(ListMov);
    // }, 100);
    render();
}

function onresize() {  // ref. https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
    var realToCSSPixels = window.devicePixelRatio;

    var actualPanelWidth = Math.floor(window.innerWidth * 0.85);  // note that right panel is 85% of window width 
    var actualPanelHeight = Math.floor(window.innerHeight - 30);

    var minDimension = Math.min(actualPanelWidth, actualPanelHeight);

    // Ajust the canvas to this dimension (square)
    canvas.width = minDimension;
    canvas.height = minDimension;

    gl.viewport(0, 0, canvas.width, canvas.height);

}



