# LazierServer
一个可以快速搭建的服务器

## 核心技术栈
**`Brain` + `Koa` + `Vue` + `NaiveUI`**

## 快速启动

* **1. 下载项目** 使用git命令克隆main分支 `git clone https://github.com/lazier334/LazierServer.git`
* **2. 安装依赖** 在项目目录中使用命令 `npm i` 
* **3. 启动项目** 使用命令 `npm start`

## docker
* 可以直接[前往docker镜像页](https://github.com/lazier334/LazierServer/pkgs/container/lazierserver)复制对应镜像的命令进行下载使用
* 可以拉取后使用命令 `docker-compose up -d` 进行构建并启动镜像

## 文件夹说明
```c
LazierServer
├─ bin                      // 脚本工具
├─ ld                       // 本地数据，主要
│  ├─ banner.txt            // banner图
│  ├─ config.json           // 本地配置
│  ├─ logs                  // .日志文件夹
│  ├─ plugins               // 主插件列表，以及插件的相关代码，方便自行开发
│  │  ├─ temporary          // .插件的临时上传、下载、解压文件夹
│  │  └─ other *.js file    // 插件文件
│  ├─ plugins-lazier334     // 插件列表，以及插件的相关代码，预设插件，由 [lazier334](https://github.com/lazier334) 提供
│  │  ├─ classes            // 插件用到的类
│  │  ├─ externals          // 第三方插件的主代码
│  │  ├─ libs               // 插件用到的库
│  │  └─ utils              // 插件用到的工具
│  ├─ web                   // 主项目资源站
│  │  ├─ example            // 文件夹 站点，示例站点
│  │  ├─ plugin             // 文件夹 站点，插件示例站点
│  │  ├─ a.com.har          // 文件   站点，har站点
│  │  └─ other              // 其他站点，名字自取
│  └─ web-lazier334         // 项目资源站，预设站点，由 [lazier334](https://github.com/lazier334) 提供
│     ├─ index              // 主站点
│     └─ utils              // 工具站点
├─ src                      // 代码
│  ├─ app.ts                // 主程序
│  └─ libs                  // 系统库(包)
│     ├─ configDef.ts       // 默认配置
│     ├─ config.ts          // 初始化配置
│     ├─ initKoa.ts         // 初始化koa
│     ├─ koaCompose.ts      // 自定义koa中间件
│     ├─ plugins.ts         // 阶段插件核心
│     ├─ StageClass.ts      // 阶段类
│     ├─ utils.ts           // 系统工具
│     └─ websocketServer.ts // websocket服务
└─ tests                    // 测试项
```

## 其他

### 忽略跟踪测试脚本
* git 忽略跟踪指定文件 `git update-index --assume-unchanged tests/testApi.js`
* git 恢复跟踪指定文件 `git update-index --no-assume-unchanged tests/testApi.js`
