import sharePNG from  'Images/share.png';
import { mat4 } from '../utils/gl-matrix';

// 正方形的变换矩阵: 相对于相机沿 z 轴后移一些
var modelViewMatrix = new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, -3.333, 1
]);

var projectionMatrix = new Float32Array([
    2.41421, 0, 0, 0,
    0, 241421, 0, 0,
    0, 0, -1.002002, -1,
    0, 0, -0.2002002, 0
]);

// 顶点着色器执行代码
var vertexShaderSource = `
    attribute vec3 vertexPosition;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;

    void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(vertexPosition, 1.0);
    }
`;
// 片段着色器执行代码
var fragmentShaderSource = `
    void main() {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
`;

function createWebGL(id) {
    const canvas = document.querySelector(id);
    var gl = canvas.getContext('webgl', {
        antialias: false,
        depth: false
    });

    // Only continue if WebGL is available and working
    if (!gl) {
        alert('Unable to initialize WebGL. Your browser or machine may not support it.');
        return;
    }

    return gl;
}

// 创建顶点数据
function createVertices(gl) {
    // 创建缓存
    var buffer = gl.createBuffer();
    // 绑定缓存到显存 gl.ARRAY_BUFFER 位置
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // 创建顶点位置
    var vertices = [
        .5, .5, 0.0,    //  x, y, z
        -.5, .5, 0.0,
        .5, -.5, 0.0,
        -.5, -.5, 0.0
    ];
    // 设置缓存数据
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    // 封装顶点数据对象
    var square = { 
        buffer: buffer,              // 顶点数组信息
        vertSize: 3,                 // 每个顶点所占的尺寸(3个浮点数来存储x, y, z的值)
        nVerts: 4,                   // 需要绘制的顶点数量(正方形4个顶点)
        primtype: gl.TRIANGLE_STRIP  // 三角形带
    };
    return square;
}

// 创建指定类型的着色器，上传source源码并编译
function createShader(gl, type, source) {
    // 创建着色器
    const shader = gl.createShader(type);
    // 为着色器对象配置执行代码
    gl.shaderSource(shader, source);
    // 编译着色器
    gl.compileShader(shader);
  
    // 检查编译是否成功
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
  
    return shader;
}

// 初始化执行程序
function createProgram(gl, vsSource, fsSource) {
    // 创建顶点着色器
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    // 创建片段着色器
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);  
    // 创建执行程序  
    const shaderProgram = gl.createProgram();
    // 将顶点着色器添加到程序
    gl.attachShader(shaderProgram, vertexShader);
    // 将片段着色器添加到程序
    gl.attachShader(shaderProgram, fragmentShader);
    // 链接代码(C类语言特有操作)
    gl.linkProgram(shaderProgram);
  
    // 判断程序链接是否成功
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }
  
    return shaderProgram;
}

function draw(gl, programInfo, vertices) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
  
    // Clear the canvas before we start drawing on it.
    // 清除除了颜色以外每一帧（frame）的深度
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    /**
     * 使用执行程序, 映射顶点数据, 映射矩阵
     */
    // 告诉 WebGL 绘制时使用的执行程序
    gl.useProgram(programInfo.program);
    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    gl.bindBuffer(gl.ARRAY_BUFFER, vertices.buffer);
    // 描述顶点数组的数据格式和位置
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition, // 指定要修改的顶点属性的索引值
        vertices.vertSize,    // 指定每个顶点由几个属性构成。必须为1、2、3或者4。初始值为4。（如position是由3个（x,y,z）组成，而颜色是4个（r,g,b,a））
        gl.FLOAT,           // 指定顶点数组中每个组件的数据类型。可用的符号常量有GL_BYTE, GL_UNSIGNED_BYTE, GL_SHORT,GL_UNSIGNED_SHORT, GL_FIXED, 和 GL_FLOAT，初始值为GL_FLOAT
        false,              // 指定当被访问时，固定点数据值是否应该被归一化（GL_TRUE）或者直接转换为固定点值（GL_FALSE）。
        0,                  // 指定连续顶点属性之间的偏移量(有时候顶点数据可能包含纹理属性)。如果为0，那么顶点属性会被理解为：它们是紧密排列在一起的。初始值为0。
        0                   // 指定第一个组件在数组的第一个顶点属性中的偏移量。该数组与GL_ARRAY_BUFFER绑定，储存于缓冲区中。初始值为0.
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
    // const projectionMatrix = createProjectionMatrixByMat4(gl);
    // const modelViewMatrix = createModelViewMatrixByMat4();
    // 将模型视图矩阵绑定到执行程序的全局变量
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
    // 将投影矩阵绑定到执行程序的全局变量
    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
    // 绘制对象
    gl.drawArrays(vertices.primtype, 0, vertices.nVerts);
}

export default function module1(id) {
    // 创建webgl对象
    const gl = createWebGL(id);
    // 初始化程序    
    const shaderProgram = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'vertexPosition')
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'projectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'modelViewMatrix')
        }
    };

    const buffers = createVertices(gl);
    draw(gl, programInfo, buffers);
}

function createProjectionMatrixByMat4(gl) {
    // Create a perspective matrix, a special matrix that is
    // used to simulate the distortion of perspective in a camera.
    // Our field of view is 45 degrees, with a width/height
    // ratio that matches the display size of the canvas
    // and we only want to see objects between 0.1 units
    // and 100 units away from the camera.

    const fieldOfView = 45 * Math.PI / 180;   // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();

    // note: glmatrix.js always has the first argument
    // as the destination to receive the result.
    mat4.perspective(
        projectionMatrix,
        fieldOfView,
        aspect,
        zNear,
        zFar
    );

    return projectionMatrix;
}

function createModelViewMatrixByMat4() {
    // Set the drawing position to the "identity" point, which is
    // the center of the scene.
    const modelViewMatrix = mat4.create();
    // Now move the drawing position a bit to where we want to
    // start drawing the square.
    mat4.translate(
        modelViewMatrix,     // destination matrix
        modelViewMatrix,     // matrix to translate
        [-0.0, 0.0, -6.0]    // amount to translate
    );  

    return modelViewMatrix;
}