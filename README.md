# LazierServer
一个可以快速搭建服务器的项目，适用于调试环境

## 核心技术栈
**`JS/TS` + `Koa`**

## 文档
LazierServer文档: https://lazier334.github.io/res/lazierserver/

## 快速启动

* **1. 下载项目** 使用全局安装命令: `npm i -g lazierserver`
* **2. 启动项目** 在项目文件夹运行命令启动: `ls334`
* **3. 查看帮助** 命令: `ls334 help`

### 快速开发

1. 完成上述全局安装
2. 从从文件夹里使用 `ls334` 命令启动服务器（**该文件夹不能位于当前项目LazierServer的文件夹内**），会把当前文件夹作为web与plugins的共用文件夹使用
4. 然后先使用 `npm i lazierserver` 安装提示模块（非必须，但没有提示会很难写，已针对'lazierserver/types'模块进行兼容，未安装模块也可以运行）
6. 创建一个插件 **可以通过导入 `lazierserver/types` 来获得提示信息**。现在可以在部署后直接从`模版列表页面 /template.html`里直接复制模版
    ```js
    import { createKoaRouter } from 'lazierserver/types';

    export default createKoaRouter(function koaRouterTest(router) {
        router.all('/test', async (ctx, next) => {
            ctx.body = 'hello test';
        });
        return router
    })
    ```
7. 创建一个静态资源文件夹 `a.b` 并把静态资源放进文件夹内，例如: `a.b/index.html` ，可通过 `switch.scanWebOnlyDoamin` 进行配置是否使用`.`作为筛选，**默认情况下文件夹必须至少含有一个 `.` 才能被识别为web资源**

## docker

**方式一: 已编译版本**
* 可以[前往docker镜像页](https://github.com/lazier334/LazierServer/pkgs/container/lazierserver)复制指定镜像版本的命令进行下载使用，也可以使用 `docker pull ghcr.io/lazier334/lazierserver:latest` 命令拉取最新版本

**方式二: 自行编译**
1. 拉取仓库 `git clone https://github.com/lazier334/LazierServer.git` 
2. 安装模块 `npm i`
3. 构建项目 `npm run build`
4. 编译镜像 `docker-compose up -d`

## 文件夹说明
```c
LazierServer/
├─ bin/                     // 脚本工具
├─ ld/                      // ⭐项目数据插件
│  ├─ banner.txt            // banner图
│  ├─ conf.js               // 本地配置
│  ├─ lazier334/            // 插件与静态资源共用的文件夹，预设插件与站点，由 [lazier334](https://github.com/lazier334) 提供
│  │  ├─ classes/           // 插件用到的类
│  │  ├─ externals/         // 第三方插件的主代码
│  │  ├─ libs/              // 插件用到的库
│  │  ├─ utils/             // 插件用到的工具
│  │  ├─ web.index/         // 主站点
│  │  ├─ web.utils/         // 工具站点
│  │  └─ *.js               // 插件文件
│  ├─ logs/                 // .日志文件夹
│  ├─ plugins/              // 主插件列表，以及插件的相关代码
│  │  ├─ temporary/         // .插件的临时上传、下载、解压文件夹
│  │  └─ *.js               // 插件文件
│  └─ web/                  // 主项目资源站
│     ├─ example/           // 文件夹 站点，示例站点
│     ├─ plugin/            // 文件夹 站点，插件示例站点
│     └─ *.har              // 文件   站点，har站点
├─ src/                     // ⭐框架核心代码
│  ├─ app.ts                // 主程序
│  └─ libs/                 // 系统库
│     ├─ config.ts          // 初始化配置
│     ├─ configDef.ts       // 默认配置
│     ├─ initKoa.ts         // 初始化koa
│     ├─ plugins.ts         // 阶段插件核心
│     └─ utils.ts           // 系统工具
├─ tests/                   // 测试项
└─ *.*                      // 其他文件用于其他辅助功能，比如docker
```
