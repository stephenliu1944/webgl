import rabbitPNG from  'Images/rabbit.png';
import { mat4 } from '../utils/gl-matrix';

export default function main(id) {
    // 创建webgl对象
    const gl = createWebGL(id);
    // 初始化程序    
    const shaderProgram = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    const vertices = createVertices(gl);
    createTextures(gl, rabbitPNG, function(vertexTexture) {
        draw(gl, shaderProgram, vertices, vertexTexture);
    });
}

// 顶点着色器执行代码
var vertexShaderSource = `
    attribute vec3 vertexPosition;
    // 纹理坐标
    attribute vec2 textureCoord;
    // 输出纹理坐标
    varying highp vec2 vTextureCoord;

    void main() {
        gl_Position = vec4(vertexPosition, 1.0);
        vTextureCoord = textureCoord;
    }
`;
// 片段着色器执行代码
var fragmentShaderSource = `
    // 纹理图片取样(uniform 全局变量不需要输入)    
    uniform sampler2D uSampler;
    // 输入的纹理坐标
    varying highp vec2 vTextureCoord;

    // 在顶点着色器中为每个顶点指定纹理坐标，然后在片元着色器中根据每个片元的纹理坐标从纹理图像中抽取纹素颜色
    void main() {
        gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
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
    // 创建顶点位置
    var vertices = [
        0.5, 0.5, 0.0,    //  x, y, z
        -0.5, 0.5, 0.0,
        0.5, -0.5, 0.0,
        -0.5, -0.5, 0.0
    ];
    // 创建缓存
    var buffer = gl.createBuffer();
    
    // 绑定缓存到显存 gl.ARRAY_BUFFER 位置
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // 设置缓存数据
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    // 封装顶点数据对象
    var square = { 
        buffer: buffer,              // 顶点数组信息
        size: 3,                     // 每个顶点所占的尺寸(3个浮点数来存储x, y, z的值)
        nVerts: 4,                   // 需要绘制的顶点数量(正方形4个顶点)
        primtype: gl.TRIANGLE_STRIP  // 三角形带
    };
    return square;
}

function createTextures(gl, url, callback) {
    var image = new Image();
    image.src = url;
    image.onload = function() {         
        var textureCoordinates = [
            1.0,  1.0,
            0.0,  1.0,
            1.0,  0.0,
            0.0,  0.0
        ];

        // 对纹理图形进行y轴反转
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        // 纹理坐标
        var buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);
        
        // 纹理图片
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            // Yes, it's a power of 2. Generate mips.
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            // No, it's not a power of 2. Turn of mips and set
            // wrapping to clamp to edge
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
        
        // 封装纹理对象
        var vertexTexture = { 
            buffer: buffer,         // 纹理坐标信息
            texture: texture,       // 纹理图片
            size: 2                 // 每个顶点所占的尺寸(3个浮点数来存储x, y, z的值)
        };
        callback && callback(vertexTexture); 
    };
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

function draw(gl, program, vertices, texture) {
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
    gl.useProgram(program);
    
    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    // 绑定顶点数组数据
    var vertexPosition = gl.getAttribLocation(program, 'vertexPosition');
    // 在对缓冲区进行操作之前也需要绑定缓冲区对象.
    gl.bindBuffer(gl.ARRAY_BUFFER, vertices.buffer);
    // 描述顶点数组的数据格式和位置
    gl.vertexAttribPointer(
        vertexPosition,     // 指定要修改的顶点属性的索引值
        vertices.size,      // 指定每个顶点由几个属性构成。必须为1、2、3或者4。初始值为4。（如position是由3个（x,y,z）组成，而颜色是4个（r,g,b,a））
        gl.FLOAT,           // 指定顶点数组中每个组件的数据类型。可用的符号常量有GL_BYTE, GL_UNSIGNED_BYTE, GL_SHORT,GL_UNSIGNED_SHORT, GL_FIXED, 和 GL_FLOAT，初始值为GL_FLOAT
        false,              // 指定当被访问时，固定点数据值是否应该被归一化（GL_TRUE）或者直接转换为固定点值（GL_FALSE）。
        0,                  // 指定连续顶点属性之间的偏移量(有时候顶点数据可能包含纹理属性)。如果为0，那么顶点属性会被理解为：它们是紧密排列在一起的。初始值为0。
        0                   // 指定第一个组件在数组的第一个顶点属性中的偏移量。该数组与GL_ARRAY_BUFFER绑定，储存于缓冲区中。初始值为0.
    );  
    gl.enableVertexAttribArray(vertexPosition);
    
    // 纹理坐标
    var textureCoord = gl.getAttribLocation(program, 'textureCoord');
    // 在对缓冲区进行操作之前也需要绑定缓冲区对象.
    gl.bindBuffer(gl.ARRAY_BUFFER, texture.buffer);
    gl.vertexAttribPointer(
        textureCoord,
        texture.size,
        gl.FLOAT,
        false,
        0,
        0
    );
    gl.enableVertexAttribArray(textureCoord);

    // 启用0号纹理单元, gl.TEXTURE0~gl.TEXTURE7是管理纹理图像的8个纹理单元
    gl.activeTexture(gl.TEXTURE0);
    // 在对缓冲区进行操作之前也需要绑定缓冲区对象.
    // 将加载的纹理绑定到0号纹理单元
    gl.bindTexture(gl.TEXTURE_2D, texture.texture);
    // 将第一个(索引)纹理单元的数据传递给取样器
    gl.uniform1i(gl.getUniformLocation(program, 'uSampler'), 0);    
    // 绘制对象
    gl.drawArrays(vertices.primtype, 0, vertices.nVerts);
}

function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
}