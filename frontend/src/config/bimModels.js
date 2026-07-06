// BIM 模型配置文件
// 每个模型需要在 BIMface 平台获取 viewToken
// autoLoad: 页面加载后是否自动加载模型
// models: 模型列表，每个模型包含 id/name/token 等属性
export const bimModelConfig = {
  autoLoad: true,
  models: [
    {
      id: 'teaching-building-a',
      name: '教学楼A栋',
      token: '02780b5a46d14cab96d0cb8cf9eab337',
      description: '3层教学楼，包含普通教室和多媒体教室',
      position: { x: 0, y: 0, z: 0 },
      visible: true
    },
    {
      id: 'teaching-building-b',
      name: '教学楼',
      token: '5a44701ecd5f4c18af58185b35b944e8',
      description: '3层教学楼，包含普通教室和多媒体教室',
      position: { x: 0, y: 0, z: 0 },
      visible: true
    }
  ],
  // 默认视角参数（eye: 相机位置, target: 目标点, up: 上方向）
  defaultView: {
    eye: [200, 200, 200],
    target: [0, 0, 0],
    up: [0, 1, 0]
  }
}
