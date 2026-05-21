# 蓝奏云盘项目改进计划

## 项目概述
本文档基于代码审查结果，提供了蓝奏云盘项目的详细改进计划，包含所有子任务的需求分析、技术调研和实现方案。

---

## 一、高优先级改进任务（安全类）

### 任务 1.1：移除 eval 函数使用，消除代码注入风险

**问题文件**：[`src/common/core/matcher.ts:96`](file:///workspace/src/common/core/matcher.ts#L96)

#### 需求分析
- **现状**：当前使用 `eval` 直接执行从 HTML 中提取的 JavaScript 代码，存在严重的安全漏洞
- **目标**：完全移除 `eval` 使用，用更安全的方式解析所需数据
- **验收标准**：
  - 所有原有功能保持正常工作
  - 无 `eval`、`Function` 等动态代码执行函数
  - 通过安全审计

#### 技术调研
- **可选方案**：
  1. **AST 解析法**：使用 Acorn 或 Esprima 解析 JavaScript 代码，提取需要的变量值
  2. **正则表达式法**：分析常见脚本模式，编写专用正则提取数据
  3. **沙箱执行法**：使用 vm2 或 isolated-vm 在受限环境执行代码
  4. **静态分析+模拟执行**：模拟执行脚本的关键部分

- **技术对比**：
  | 方案 | 安全性 | 开发复杂度 | 维护成本 | 推荐度 |
  |------|--------|------------|----------|--------|
  | AST解析 | 高 | 高 | 中 | ⭐⭐⭐⭐ |
  | 正则表达式 | 高 | 中 | 高 | ⭐⭐⭐ |
  | 沙箱执行 | 中 | 低 | 低 | ⭐⭐ |
  | 模拟执行 | 高 | 很高 | 中 | ⭐⭐⭐⭐⭐ |

#### 实现方案
**推荐方案：混合使用正则表达式 + 有限范围的 AST 解析**

**步骤**：
1. 分析当前 `parseAjaxData` 处理的所有脚本模式
2. 为每种常见模式编写专用解析器
3. 创建安全的变量提取器
4. 保留完整的测试用例

**代码示例**：
```typescript
// 新建文件：src/common/core/safe-parser.ts
import { parse } from 'acorn';
import { simple } from 'acorn-walk';

interface ExtractedData {
  url?: string;
  data?: Record<string, any>;
  // 其他需要提取的字段
}

export class SafeParser {
  static extractAjaxInfo(script: string): ExtractedData {
    // 先用正则快速处理常见模式
    const patterns = [
      // 匹配常见的 $.ajax 调用
      /\$\.ajax\(\s*(\{[\s\S]*?\})\s*\)/,
      // 匹配变量赋值
      /var\s+(\w+)\s*=\s*(\{[\s\S]*?\});/
    ];
    
    for (const pattern of patterns) {
      const match = script.match(pattern);
      if (match) {
        try {
          return this.parseWithAST(match[1]);
        } catch {
          continue;
        }
      }
    }
    
    throw new Error('无法安全解析脚本');
  }
  
  private static parseWithAST(code: string): ExtractedData {
    const ast = parse(`const __temp = ${code}`, { ecmaVersion: 2020 });
    const result: ExtractedData = {};
    
    simple(ast, {
      ObjectExpression(node) {
        // 安全地提取对象属性
        node.properties.forEach(prop => {
          if (prop.type === 'Property' && prop.key.type === 'Identifier') {
            // 递归处理值
          }
        });
      }
    });
    
    return result;
  }
}
```

---

### 任务 1.2：修复 HTTPS 证书验证问题

**问题文件**：[`src/common/http.ts:59`](file:///workspace/src/common/http.ts#L59)

#### 需求分析
- **现状**：`rejectUnauthorized: false` 禁用了 SSL 证书验证
- **目标**：在生产环境启用证书验证，仅在开发环境可选择禁用
- **验收标准**：
  - 生产环境强制验证证书
  - 开发环境提供配置选项
  - 添加证书错误提示

#### 技术调研
- **相关依赖**：got 库的 HTTPS 配置
- **环境变量使用**：NODE_ENV 判断环境
- **代理配置**：保留开发时代理功能但增加安全警告

#### 实现方案
```typescript
// 修改 src/common/http.ts
const isDev = process.env.NODE_ENV === 'development';

const base = got.extend({
  https: {
    rejectUnauthorized: !isDev || process.env.DISABLE_SSL_VALIDATION !== 'true',
  },
  ...(isDev
    ? {
        agent: process.env.HTTP_PROXY 
          ? {
              https: new (require('hpagent').HttpsProxyAgent)({
                keepAlive: true,
                rejectUnauthorized: process.env.DISABLE_SSL_VALIDATION === 'true',
                proxy: process.env.HTTP_PROXY,
              }),
            }
          : {},
      }
    : {}),
});
```

---

### 任务 1.3：生产环境隐藏调试功能

**问题文件**：[`src/renderer/page/Setting.tsx:126`](file:///workspace/src/renderer/page/Setting.tsx#L126)

#### 需求分析
- **现状**：调试开关在生产环境也可见
- **目标**：生产环境完全移除调试相关UI和功能
- **验收标准**：
  - 生产构建中无调试代码
  - 通过构建时的条件编译实现

#### 实现方案
```typescript
// 修改 src/renderer/page/Setting.tsx
const Setting = observer(() => {
  const debug = process.env.NODE_ENV === 'development' || !!window.__DEV__;
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  // ... 其他代码 ...

  return (
    <MyScrollView className="pt-[60px] pl-[30px]">
      <Form labelAlign="left" colon={false} labelCol={{ flex: '110px', style: { fontWeight: 'bold' } }}>
        {/* ... 其他表单项 ... */}
        
        {debug && (
          <>
            <Form.Item label="开发模式">
              <Checkbox checked={debug} onChange={e => window.__DEV__ = e.target.checked} />
            </Form.Item>
            <Form.Item label="控制台">
              <Button onClick={() => getCurrentWindow().webContents.toggleDevTools()}>切换</Button>
            </Form.Item>
          </>
        )}
        
        {/* ... 其他代码 ... */}
      </Form>
    </MyScrollView>
  );
});
```

---

## 二、中优先级改进任务（架构优化）

### 任务 2.1：提取 Upload 和 Download 公共逻辑

**问题文件**：
- [`src/renderer/store/Upload.ts`](file:///workspace/src/renderer/store/Upload.ts)
- [`src/renderer/store/Download.ts`](file:///workspace/src/renderer/store/Download.ts)

#### 需求分析
- **现状**：两个类有 60%+ 的重复代码
- **目标**：创建抽象基类，消除代码重复
- **验收标准**：
  - 代码重复率降低 50% 以上
  - 功能保持完整
  - 易于扩展新的任务类型

#### 技术调研
- **设计模式**：模板方法模式、策略模式
- **状态管理**：保持 MobX 集成
- **类型安全**：使用 TypeScript 泛型

#### 实现方案

**第一步：创建抽象基类**
```typescript
// 新建文件：src/renderer/store/BaseTaskManager.ts
import { EventEmitter } from 'events';
import { autorun, makeObservable, observable } from 'mobx';
import { persist } from 'mobx-persist';
import Task, { TaskStatus } from './AbstractTask';

export interface SubTask {
  status: TaskStatus;
}

export interface MainTask<ST extends SubTask> {
  tasks: ST[];
  id: string;
  status: TaskStatus;
  beforeAddTask?(): Promise<any>;
  initTask?(): Promise<any>;
  getStream?(subTask: ST): any;
  finishTask?(): Promise<any>;
}

export abstract class BaseTaskManager<MT extends MainTask<ST>, ST extends SubTask> 
  extends EventEmitter 
  implements Task<MT> {
  
  @persist('list') list: MT[] = [];
  protected handler: ReturnType<typeof autorun>;
  protected abstract taskSignal: Record<string, AbortController>;
  
  constructor() {
    super();
    makeObservable(this, { list: observable });
    process.nextTick(() => this.init());
  }
  
  protected abstract init(): void;
  protected abstract startQueue(): void;
  protected abstract checkTask(): void;
  protected abstract canStart(): boolean;
  protected abstract getId(task: MT): string;
  protected abstract start(id: string, reset?: boolean): Promise<void>;
  
  // 公共方法实现
  pause(id: string) {
    const task = this.list.find(item => this.getId(item) === id);
    if (task) {
      task.tasks.forEach(subTask => {
        switch (subTask.status) {
          case TaskStatus.ready:
            subTask.status = TaskStatus.pause;
            break;
          case TaskStatus.pending:
            this.abortTask(subTask);
            break;
        }
      });
    }
  }
  
  pauseAll() {
    this.list.forEach(item => this.pause(this.getId(item)));
  }
  
  remove(id: string) {
    const task = this.list.find(item => this.getId(item) === id);
    if (task) {
      task.tasks.forEach(this.abortTask.bind(this));
      this.list = this.list.filter(item => this.getId(item) !== id);
    }
  }
  
  removeAll() {
    this.list.forEach(item => this.remove(this.getId(item)));
  }
  
  startAll() {
    this.list.forEach(task => {
      task.tasks.forEach(subTask => {
        if (subTask.status === TaskStatus.pause) {
          subTask.status = TaskStatus.ready;
        }
      });
      this.start(this.getId(task));
    });
  }
  
  protected abstract abortTask(subTask: ST): void;
  
  get queue() {
    return this.getList(item => item.status === TaskStatus.pending).length;
  }
  
  getList(filter: (item: ST) => boolean) {
    return this.list
      .map(item => item.tasks)
      .flat()
      .filter(filter);
  }
}
```

---

### 任务 2.2：完善 TypeScript 类型定义

**涉及文件**：整个项目

#### 需求分析
- **现状**：大量使用 `any` 类型，类型不安全
- **目标**：消除显式 `any`，完善类型定义
- **验收标准**：
  - ESLint `no-explicit-any` 规则通过
  - 所有 API 响应有完整类型
  - 无类型断言滥用

#### 实现方案

**第一步：定义 API 响应类型**
```typescript
// 新建/完善文件：src/types/api.ts
export interface BaseApiResponse {
  zt: number;
  info?: string;
  text?: string;
}

export interface Task5Res extends BaseApiResponse {
  text: FileInfo[];
}

export interface Task20Res extends BaseApiResponse {
  // 具体字段
}

export interface Task47Res extends BaseApiResponse {
  text: FolderInfo[];
  info: CrumbsInfo[];
}

export interface Html5upRes extends BaseApiResponse {
  // 上传响应字段
}

// 完善已有类型
export interface FileInfo {
  id: FileId;
  name_all: string;
  size: string;
  time: string;
  downs: string;
  icon: string;
  onof: number;
  is_des: number;
  // 添加其他字段
}

export interface FolderInfo {
  fol_id: FolderId;
  name: string;
  folder_des?: string;
  // 添加其他字段
}
```

**第二步：渐进式替换 any**
```typescript
// 修改 eslint 配置，阶段性启用严格规则
// .eslintrc.js
rules: {
  '@typescript-eslint/no-explicit-any': ['warn', { 
    fixToUnknown: true,
    ignoreRestArgs: true 
  }],
  // 其他规则保持不变
}
```

---

### 任务 2.3：优化文件树生成，添加请求控制

**问题文件**：[`src/common/core/mv.ts:55`](file:///workspace/src/common/core/mv.ts#L55)

#### 需求分析
- **现状**：文件树生成无并发控制，可能触发速率限制
- **目标**：添加并发控制和请求间隔
- **验收标准**：
  - 支持配置并发数
  - 请求之间有间隔
  - 大文件夹处理更稳定

#### 实现方案
```typescript
// 修改 src/common/core/mv.ts
import { asyncMap } from '../util';

// 添加配置
const FILE_TREE_CONFIG = {
  concurrency: 3,      // 并发数
  requestDelay: 200,   // 请求间隔(ms)
};

export async function fileTree(
  files: MoveFiles[] = [], 
  level = 0,
  config = FILE_TREE_CONFIG
): Promise<FileTree[]> {
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  return asyncMap(
    files,
    async (file, index) => {
      if (index > 0) {
        await delay(config.requestDelay);
      }
      
      const item = new FileTree(file);
      if (item.type === URLType.folder) {
        const nextLevel = level + 1;
        if (nextLevel > 4) {
          throw new Error(`${item.name} 移动后超过4层，操作已取消！`);
        }
        const next = await ls(item.id);
        item.children = await fileTree(next.text, nextLevel, config);
      }
      return item;
    },
    { thread: config.concurrency }
  );
}
```

---

## 三、低优先级长期改进任务

### 任务 3.1：添加国际化（i18n）支持

#### 需求分析
- **现状**：所有文案中文硬编码
- **目标**：支持多语言切换
- **验收标准**：
  - 支持中文/英文
  - 易于添加新语言
  - 语言设置持久化

#### 技术调研
- **推荐库**：react-i18next + i18next
- **替代方案**：lingui、formatjs
- **推荐度**：react-i18next ⭐⭐⭐⭐⭐

#### 实现方案
```typescript
// 新建文件：src/renderer/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  zh: {
    translation: require('./locales/zh.json'),
  },
  en: {
    translation: require('./locales/en.json'),
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'zh',
    fallbackLng: 'zh',
    interpolation: { escapeValue: false },
  });

export default i18n;

// 新建语言文件
// src/renderer/i18n/locales/zh.json
{
  "common": {
    "confirm": "确认",
    "cancel": "取消",
    "delete": "删除"
  },
  "files": {
    "searchPlaceholder": "搜索当前页面",
    "upload": "上传",
    "newFolder": "新建文件夹"
  }
}
```

---

### 任务 3.2：重构 Files 组件，拆分为小组件

**问题文件**：[`src/renderer/page/Files/index.tsx`](file:///workspace/src/renderer/page/Files/index.tsx)

#### 需求分析
- **现状**：单个文件 700+ 行，维护困难
- **目标**：拆分为职责单一的小组件
- **组件拆分建议**：
  - `FileList` - 文件列表展示
  - `FileActions` - 文件操作菜单
  - `FolderNavigation` - 面包屑导航
  - `ModalComponents` - 各类模态框
  - `useFileOperations` - 操作 Hook

#### 实现方案结构
```
src/renderer/page/Files/
├── index.tsx                 # 主入口
├── components/
│   ├── FileList.tsx         # 文件列表
│   ├── FileActions.tsx      # 操作菜单
│   ├── FolderNavigation.tsx # 面包屑
│   └── modals/
│       ├── NewFolderModal.tsx
│       ├── MoveFilesModal.tsx
│       └── FileDescModal.tsx
└── hooks/
    ├── useFileOperations.ts
    ├── useFileSelection.ts
    └── useFolderNavigation.ts
```

---

### 任务 3.3：完善测试覆盖

#### 需求分析
- **现状**：测试覆盖极少
- **目标**：核心功能测试覆盖率 > 60%
- **测试范围**：
  - 工具函数（util.ts）
  - API 请求模块
  - 状态管理逻辑
  - 组件基础渲染

#### 技术方案
```typescript
// 示例测试文件：src/common/util.test.ts
import { 
  sizeToByte, 
  byteToSize, 
  parseShare,
  asyncMap 
} from './util';

describe('sizeToByte', () => {
  test('正确转换常见单位', () => {
    expect(sizeToByte('1k')).toBe(1024);
    expect(sizeToByte('1m')).toBe(1024 * 1024);
    expect(sizeToByte('1g')).toBe(1024 * 1024 * 1024);
  });
  
  test('处理小数', () => {
    expect(sizeToByte('1.5k')).toBe(1536);
  });
  
  test('处理空格和逗号', () => {
    expect(sizeToByte('1,024 k')).toBe(1024 * 1024);
  });
});

describe('asyncMap', () => {
  test('并发控制正常工作', async () => {
    const order: number[] = [];
    const task = (n: number) => 
      new Promise(resolve => setTimeout(() => {
        order.push(n);
        resolve(n);
      }, 100 - n * 10));
    
    const result = await asyncMap([1, 2, 3, 4, 5], task, { thread: 2 });
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });
});
```

---

### 任务 3.4：完善日志系统

#### 需求分析
- **现状**：使用简单 console.log
- **目标**：专业的日志系统，支持分级和文件输出
- **推荐库**：winston 或 electron-log

#### 实现方案
```typescript
// 新建文件：src/common/logger.ts
import { createLogger, format, transports } from 'winston';
import { is } from 'electron-is';
import path from 'path';
import { app } from 'electron';

const logDir = is.dev() 
  ? path.join(process.cwd(), 'logs')
  : path.join(app.getPath('userData'), 'logs');

export const logger = createLogger({
  level: is.dev() ? 'debug' : 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error' 
    }),
    new transports.File({ 
      filename: path.join(logDir, 'combined.log') 
    }),
  ],
});

if (is.dev()) {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    ),
  }));
}
```

---

## 四、实施路线图

### 阶段一：安全加固（1-2周）
- [ ] 任务 1.1：移除 eval
- [ ] 任务 1.2：修复 HTTPS
- [ ] 任务 1.3：隐藏调试功能

### 阶段二：架构优化（2-3周）
- [ ] 任务 2.1：提取公共逻辑
- [ ] 任务 2.2：完善 TypeScript
- [ ] 任务 2.3：优化文件树生成

### 阶段三：体验提升（3-4周）
- [ ] 任务 3.1：国际化
- [ ] 任务 3.2：组件重构
- [ ] 任务 3.3：完善测试
- [ ] 任务 3.4：日志系统

---

## 五、风险评估

| 任务 | 风险等级 | 应对措施 |
|------|----------|----------|
| 移除 eval | 高 | 充分测试，保留兼容性开关 |
| 提取公共逻辑 | 中 | 增量重构，每步都有完整测试 |
| 组件重构 | 中 | 保持对外 API 不变 |
| 国际化 | 低 | 渐进式添加，默认保持中文 |

---

## 六、验收标准

- 所有高优先级任务必须完成
- 代码审查通过
- 完整的自动化测试
- 无安全漏洞（通过安全扫描）
- 性能无明显下降

---

## 附录：相关资源

- [TypeScript 官方文档](https://www.typescriptlang.org/)
- [React 测试库](https://testing-library.com/docs/react-testing-library/intro/)
- [react-i18next](https://react.i18next.com/)
- [winston 日志库](https://github.com/winstonjs/winston)
