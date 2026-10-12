# Roomly · 会议室预约

一个开箱即用的会议室预约应用：选择会议室与时段、自动检测时间冲突、管理你的预约。
**无需登录、无需服务器**——所有数据保存在你自己的浏览器里（localStorage）。

## Live URL

**https://x15967311210-crypto.github.io/roomly/**

（GitHub Pages 自动部署：推送到 `main` 后由 `.github/workflows/deploy-pages.yml` 构建并发布。）

## 这个应用做什么

- **预订会议室**：4 间会议室（容量 4–20 人，含投影仪 / 视频会议 / 白板），选择日期与时段即可预约。
- **冲突检测**：同一会议室的重叠时段会被拒绝，并指出与哪条预约、哪个时段冲突；同一预约人跨会议室的重叠也会被拒绝。
- **业务规则**：办公时段 09:00–18:00、单次最长 4 小时、参会人数不超过会议室容量、不能预约过去的日期、最多提前 30 天。
- **我的预约**：按「即将开始 / 全部 / 已取消」筛选，已开始的预约不可取消。
- **会议室视图**：查看任意一天每间会议室的占用时段与占用时长。

## 本地运行

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 产物在 dist/
npm run preview  # 预览构建产物 http://localhost:4173
```

## 数据与重置

数据保存在浏览器 `localStorage`（键：`roomly.bookings.v1` / `roomly.profile.v1`）。

- 右上角 **载入示例** 一键填充两个演示预约；
- 右上角 **清空数据** 恢复空白初始状态。

因为是纯前端 + 本地存储，**每个新的浏览器会话都从干净状态开始**，测试可以重复运行而不互相污染。

## 目录结构

```
src/
  rules.ts               业务规则（纯函数：冲突检测、时段校验、开闭时段、可取消判断）
  store.ts               localStorage 持久化
  data.ts                会议室清单
  components/
    BookingForm.tsx      预约表单 + 即时校验
    MyBookings.tsx       预约列表 / 筛选 / 取消
    RoomsView.tsx        按天查看会议室占用
public/                  静态资源
```

## TestSprite 测试

- **接入方式**：GitHub App（零改仓）
- **测试对象**：上面的 Live URL
- **当前 suite**：11 条前端测试，全部通过

### 自动生成（5 条 · 主流程与浏览）

| 测试 | 覆盖 |
| --- | --- |
| Create a room reservation | 完整预约流程 |
| Browse my upcoming reservations | 「即将开始」列表 |
| Browse all reservations | 「全部」筛选 |
| Browse canceled reservations | 「已取消」筛选 |
| View room availability details | 按天查看会议室占用 |

### 业务规则（6 条 · 边界与拒绝路径）

| 测试 | 断言要点 |
| --- | --- |
| Rejects a reservation that overlaps an existing booking in the same room | 报错含「占用」并点名冲突的预约；未创建第二条 |
| Rejects booking a second room at a time the same person is already booked | 跨会议室重复预约被拒，点名既有预约 |
| Rejects a reservation whose attendee count exceeds the room capacity | 报错含「容量」与上限人数 |
| Rejects a reservation longer than the four-hour maximum | 报错含「4 小时」上限 |
| Rejects a reservation whose end time is not after its start time | 报错含「结束时间必须晚于开始时间」 |
| Cancels an upcoming reservation and moves it out of the upcoming list | 状态转「已取消」；从「即将开始」消失、在「已取消」出现 |

## 技术栈

React 18 + Vite 5 + TypeScript（严格模式），零运行时依赖，零后端。
