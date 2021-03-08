const { src, dest, parallel, series, watch } = require("gulp");
const path = require("path");
const bs = require("browser-sync").create();
const plugins = require("gulp-load-plugins")();
const del = require("del");
//The process.cwd() method returns the current working directory of the Node.js process.
const cwd = process.cwd();

let data = {
  //default value
  //项目中文件的默认值
  build: {
    src: "src",
    dist: "dist",
    temp: "temp",
    public: "public",
    paths: {
      styles: "assets/styles/*.scss",
      scripts: "assets/scripts/*.js",
      pages: "*.html",
      fonts: "assets/fonts/**",
      images: "assets/images/**",
    },
  },
};
try {
  data = { ...data, ...require(path.join(cwd, "./workflow.config.js")) };
} catch (error) {}

// 处理scss
function styles() {
  //由 src() 生成的 Vinyl 实例是用 glob base 集作为它们的 base 属性构造的。当使用 dest() 写入文件系统时，将从输出路径中删除 base ，以保留目录结构。
  return src(data.build.paths.styles, { base: "src", cwd: data.build.src })
    .pipe(plugins.sass({ outputStyle: "expanded" }))
    .pipe(dest(data.build.temp))
    .pipe(bs.reload({ stream: true }));
}
// 处理js脚本
function scripts() {
  return src(data.build.paths.scripts, { base: "src", cwd: data.build.src })
    .pipe(plugins.babel({ presets: [require("@babel/preset-env")] }))
    .pipe(dest(data.build.temp))
    .pipe(bs.reload({ stream: true }));
}

//处理html文件

function pages() {
  // data是模版数据的填充
  return src(data.build.paths.pages, { base: "src", cwd: data.build.src })
    .pipe(plugins.swig({ data, cache: false }))
    .pipe(dest(data.build.temp))
    .pipe(bs.reload({ stream: true }));
}

// 压缩图片文件

function images() {
  return src(data.build.paths.images, { base: "src", cwd: data.build.src })
    .pipe(plugins.imagemin())
    .pipe(dest(data.build.dist));
}
//  处理字体文件
function fonts() {
  return src(data.build.paths.fonts, { base: "src", cwd: data.build.src })
    .pipe(plugins.imagemin())
    .pipe(dest(data.build.dist));
}

// 复制public 的文件
function extra() {
  return src("**", { base: "public", cwd: data.build.public }).pipe(
    dest(data.build.dist)
  );
}

// 删除dist目录下面的文件

function clean() {
  // 返回的是一个promise
  return del([data.build.dist, data.build.temp]);
}

// 使用gulp-useref处理文件的路径
function useref() {
  // 对构建后的html文件做处理，
  return (
    src(data.build.paths.pages, { base: "temp", cwd: data.build.temp })
      // 搜索引用文件的路径
      .pipe(plugins.useref({ searchPath: [data.build.temp, "."] }))
      // 压缩文件
      .pipe(plugins.if("*.js", plugins.uglify()))
      .pipe(plugins.if("*.css", plugins.cleanCss()))
      .pipe(
        plugins.if(
          "*.html",
          plugins.htmlmin({
            collapseWhitespace: true,
            minifyCss: true,
            minifyJs: true,
          })
        )
      )
      // 处理后的文件有html、js、css三部分，开始路径和目标路径一样可能会导致文件写入不进去的问题，所以又该目标路径为release
      .pipe(dest(data.build.dist))
  );
}

// 创建一个开发服务器
function serve() {
  watch(data.build.paths.styles, { cwd: data.build.src }, styles);
  watch(data.build.paths.scripts, { cwd: data.build.src }, scripts);
  watch(data.build.paths.pages, { cwd: data.build.src }, pages);
  // watch('src/assets/images/**', images)
  // watch('src/assets/fonts/**', fonts)
  // watch('public/**', extra)
  watch(
    [
      path.join(data.build.src, data.build.paths.images),
      path.join(data.build.src, data.build.paths.fonts),
      path.join(data.build.public, "**"),
    ],
    bs.reload
  );
  bs.init({
    server: {
      //制定对那些文件启动静态服务
      baseDir: [data.build.temp, data.build.src, data.build.public],
      routes: {
        "/node_modules": "node_modules",
      },
    },
    //	制定端口
    port: 3000,
    // 是否在浏览器直接打开
    open: true,
    // 是否显示服务器启动时候的提示信息
    notify: false,
    // 添加那些文件的变化
    // files: 'dist/**'
  });
}

const compile = parallel(styles, scripts, pages);

const build = series(
  clean,
  parallel(series(compile, useref), images, fonts, extra)
);

const develop = series(clean, compile, serve);

module.exports = {
  build,
  develop,
};
