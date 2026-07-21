# LazierServer
一个可以快速搭建的服务器

## 核心技术栈
**`JS/TS` + `Koa`**

## 全局安装与启动
* **1. 下载项目** 使用git命令克隆main分支 `git clone https://github.com/lazier334/LazierServer.git`
* **2. 安装项目** 使用命令 `npm i -g .`
* **3. 启动项目** 使用命令 `ls334`
* **4. 停止项目** 使用命令 `ls334 stop`

### 快速开发（类型提示不完善，请以原始项目为准）
> **类型提示不完善，请以原始项目为准**

1. 完成上述全局安装
2. 创建一个空文件夹，并从文件夹里使用命令启动服务器，**该文件夹不能位于当前项目LazierServer的文件夹内** 
3. 直接把当前文件夹作为web与plugins的共用文件夹使用
4. 先使用 `npm init` 初始化
5. 然后使用 `npm link lazierserver` 关联项目
6. 创建一个插件 **可以通过导入 `lazierserver/types` 来获得提示信息**
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

## 普通快速启动

* **1. 下载项目** 使用git命令克隆main分支 `git clone https://github.com/lazier334/LazierServer.git`
* **2. 启动项目** 使用命令 `npm start`

## docker
* 可以直接[前往docker镜像页](https://github.com/lazier334/LazierServer/pkgs/container/lazierserver)复制对应镜像的命令进行下载使用
* 可以拉取后使用命令 `docker-compose up -d` 进行构建并启动镜像

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

## 其他

### 忽略跟踪测试脚本
* git 忽略跟踪指定文件 `git update-index --assume-unchanged tests/testApi.js`
* git 恢复跟踪指定文件 `git update-index --no-assume-unchanged tests/testApi.js`
