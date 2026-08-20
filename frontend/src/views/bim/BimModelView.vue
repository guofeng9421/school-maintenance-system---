<template>
  <div class="bim-container">
    <el-row :gutter="0" style="height: 100%;">
      <!-- 左侧：3D模型区域 -->
      <el-col :span="16" style="height: 100%;">
        <div class="model-viewer">
          <!-- 工具栏：楼层选择 + 模型加载状态 -->
          <div class="viewer-toolbar">
            <div class="toolbar-left">
              <!-- 楼层下拉框：初始为空，点击构件后才填充数据 -->
              <el-select v-model="selectFloorData" placeholder="请选择楼层" size="small" clearable class="floor-select" @change="handleFloorChange">
                <el-option v-for="item in floorData" :key="item.actualName" :label="item.name" :value="item.actualName" />
              </el-select>
              <el-button size="small" @click="resetFloorSelection">重置</el-button>
            </div>
            <div class="toolbar-right">
              <!-- 模型加载计数 -->
              <el-tag :type="allModelsLoaded ? 'success' : 'warning'" size="small">
                {{ loadedModelCount }}/{{ modelList.length }} 模型已加载
              </el-tag>
            </div>
          </div>
          <!-- BIM 3D 容器 -->
          <div id="bim-container" ref="bimContainerRef" style="width:100%;height:calc(100% - 50px);"></div>
          <!-- SDK 加载中遮罩：阻止用户在模型加载完成前操作 -->
          <div v-if="!modelLoaded && modelList.length > 0" class="loading-overlay">
            <i class="el-icon-loading" style="font-size:32px;color:#409eff;"></i>
            <p style="margin-top:12px;color:#606266;">模型加载中，请稍候...</p>
          </div>
          <!-- 未加载时的占位提示 -->
          <div v-if="!modelLoaded && modelList.length === 0" class="model-placeholder">
            <el-empty description="请加载BIM模型">
              <el-button type="primary" @click="loadAllModels">加载全部模型</el-button>
            </el-empty>
          </div>
        </div>
      </el-col>
      <!-- 右侧：信息面板 -->
      <el-col :span="8" style="height: 100%;">
        <div class="side-panel">
          <el-tabs v-model="activeTab">
            <!-- 构件信息面板：点击构件后显示详情 -->
            <el-tab-pane label="构件信息" name="element">
              <div v-if="selectedElement.id" class="element-info">
                <el-descriptions :column="1" border size="small">
                  <el-descriptions-item label="构件ID">{{ selectedElement.id }}</el-descriptions-item>
                  <el-descriptions-item label="构件名称">{{ selectedElement.name }}</el-descriptions-item>
                  <el-descriptions-item label="所属楼层">{{ selectedElement.floor }}</el-descriptions-item>
                  <el-descriptions-item label="房间">{{ selectedElement.room }}</el-descriptions-item>
                  <el-descriptions-item label="所属模型">{{ selectedElement.modelName }}</el-descriptions-item>
                </el-descriptions>
                <el-button type="primary" size="small" style="margin-top: 12px; width: 100%;" @click="goCreateRecord">
                  <i class="el-icon-plus"></i> 为此构件维修
                </el-button>
              </div>
              <el-empty v-else description="点击模型中的构件查看信息" :image-size="80" />
            </el-tab-pane>
            <!-- 关联记录面板：显示该构件的维修记录 -->
            <el-tab-pane label="关联记录" name="records">
              <div v-if="elementRecords.length > 0">
                <el-card v-for="record in elementRecords" :key="record.id" class="record-card" shadow="never">
                  <div class="record-title">{{ record.title }}</div>
                  <div class="record-meta">
                    <el-tag size="small" :type="statusType[record.status]">{{ statusMap[record.status] }}</el-tag>
                    <span class="record-time">{{ formatDate(record.created_at) }}</span>
                  </div>
                </el-card>
              </div>
              <el-empty v-else description="暂无关联维修记录" :image-size="80" />
            </el-tab-pane>
            <!-- 模型概览面板：显示模型状态和加载情况 -->
            <el-tab-pane label="模型概览" name="overview">
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="模型状态">{{ modelLoaded ? '已加载' : '未加载' }}</el-descriptions-item>
                <el-descriptions-item label="已加载模型">{{ loadedModelCount }}/{{ modelList.length }}</el-descriptions-item>
                <el-descriptions-item label="选中构件">{{ selectedElement ? selectedElement.name : '无' }}</el-descriptions-item>
                <el-descriptions-item label="关联记录数">{{ elementRecords.length }}</el-descriptions-item>
              </el-descriptions>
              <div class="model-status-list">
                <div v-for="model in modelList" :key="model.id" class="model-status-item">
                  <el-tag :type="model.loaded ? 'success' : 'info'" size="small">
                    {{ model.loaded ? '已加载' : '未加载' }}
                  </el-tag>
                  <span class="model-name">{{ model.name }}</span>
                </div>
              </div>
              <el-button v-if="!allModelsLoaded" type="primary" size="small" style="margin-top: 12px; width: 100%;" @click="loadAllModels">
                重新加载模型
              </el-button>
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { statusMap, statusType } from "../../config/constants";
import { formatDate } from "../../utils";

export default {
  name: "BimModelView",
  data() {
    return {
      modelLoaded: false,
      activeTab: "element",
      bimViewers: {},
      sharedApp: null,
      sharedViewer: null,
      modelList: [],
      selectedElement: { id: "", name: "", floor: "", room: "", modelName: "", familyType: "" },
      elementRecords: [],
      floorData: [],
      allFloorData: [],
      modelFloors: {},
      currentFloorModel: null,
      selectFloorData: "",
      pendingFocusId: null,
      activeTimers: [], // 存储 setTimeout ID，用于 beforeDestroy 清理
      viewerClickHandler: null, // 存储 viewer 点击事件处理器
      statusMap,
      statusType,
    };
  },
  computed: {
    loadedModelCount() {
      return this.modelList.filter((m) => m.loaded).length;
    },
    allModelsLoaded() {
      return (
        this.modelList.length > 0 &&
        this.loadedModelCount === this.modelList.length
      );
    },
  },
  async mounted() {
    if (this.$route.query.model_element_id) {
      this.pendingFocusId = String(this.$route.query.model_element_id);
    }
    await this.fetchModels();
  },
  beforeDestroy() {
    // 清理所有 setTimeout 定时器
    this.activeTimers.forEach((id) => clearTimeout(id));
    this.activeTimers = [];

    // 移除窗口 resize 监听
    window.onresize = null;

    // 移除 viewer 点击事件监听
    if (this.sharedViewer && this.viewerClickHandler) {
      try {
        this.sharedViewer.removeEventListener(
          Glodon.Bimface.Viewer.Viewer3DEvent.MouseClicked,
          this.viewerClickHandler
        );
      } catch (e) {}
    }

    // 销毁 BIM SDK WebGL 应用，释放显存
    if (this.sharedApp) {
      try {
        this.sharedApp.destroy();
      } catch (e) {}
      this.sharedApp = null;
    }
    this.sharedViewer = null;
    this.bimViewers = {};

    // 移除 iframe 降级方案创建的 DOM 节点
    const container = document.getElementById("bim-container");
    if (container) {
      const iframes = container.querySelectorAll('div[id^="model-"]');
      iframes.forEach((el) => el.remove());
    }
  },
  methods: {
    formatDate,
    // 追踪 setTimeout，组件销毁时自动清理
    trackTimeout(fn, delay) {
      const id = setTimeout(fn, delay);
      this.activeTimers.push(id);
      return id;
    },
    // 统一消息提示：关闭前一个消息 + 短时间显示
    showToast(type, msg) {
      this.$message.closeAll();
      this.$message({ type, message: msg, duration: 1500 });
    },

    // ========================= 模型加载 =========================

    // 从后端获取模型列表（含 viewToken），走统一API层
    async fetchModels() {
      try {
        const res = await this.$API.bimfaceApi.getModels();
        if (res.code === 200) {
          const noTokenModels = res.data.filter((m) => !m.token);
          if (noTokenModels.length > 0) {
            this.$message.warning(`${noTokenModels.map(m => m.name).join('、')} 的 ViewToken 为空，已跳过加载`);
          }
          this.modelList = res.data
            .filter((m) => m.token)
            .map((m) => ({
              ...m,
              loaded: false,
              viewer: null,
            }));
        }
        if (this.modelList.length > 0) {
          this.loadAllModels();
        }
      } catch (e) {
        console.error("获取模型列表失败:", e);
        this.showToast("error", "获取模型列表失败");
      }
    },

    // 加载所有未加载的模型
    loadAllModels() {
      const modelsToLoad = this.modelList.filter((m) => m.token && !m.loaded);
      if (modelsToLoad.length === 0) {
        this.showToast("warning", "没有可用的模型");
        return;
      }
      this.loadSdkFirst(modelsToLoad);
    },

    // 先加载 SDK，再逐个添加模型视图
    // BimfaceSDKLoader.load() 只能成功调用一次，所以先用第一个 token 初始化 SDK
    loadSdkFirst(modelsToLoad) {
      const self = this;
      const container = document.getElementById("bim-container");
      if (!container) return;
      container.style.position = "relative";

      if (
        typeof BimfaceSDKLoader !== "undefined" &&
        typeof BimfaceSDKLoaderConfig !== "undefined"
      ) {
        const loaderConfig = new BimfaceSDKLoaderConfig();
        loaderConfig.viewToken = modelsToLoad[0].token;

        BimfaceSDKLoader.load(
          loaderConfig,
          (viewMetaData) => {
            // SDK 加载成功，创建 3D 应用和 viewer
            const webAppConfig =
              new Glodon.Bimface.Application.WebApplication3DConfig();
            webAppConfig.domElement = container;
            self.sharedApp = new Glodon.Bimface.Application.WebApplication3D(
              webAppConfig
            );
            self.sharedViewer = self.sharedApp.getViewer();

            // 逐个添加模型视图
            self.addViewsSequentially(modelsToLoad, 0);
          },
          (error) => {
            console.error("SDK加载失败:", error);
            // SDK 加载失败时降级为 iframe 方式
            self.loadByIframeFallback(modelsToLoad);
          }
        );
      } else {
        // 不支持 SDK 时直接用 iframe 方式
        this.loadByIframeFallback(modelsToLoad);
      }
    },

    // 逐个添加模型视图（addView 方式）
    addViewsSequentially(models, index) {
      if (index >= models.length) {
        // 所有模型添加完成后，初始化 viewer 设置
        if (this.loadedModelCount > 0) {
          this.showToast("success", `共加载 ${this.loadedModelCount} 个模型`);
        }
        this.setupViewer();
        return;
      }
      const model = models[index];
      this.showToast("info", `${model.name} 正在加载...`);
      try {
        this.sharedApp.addView(model.token);
        const viewer3D = this.sharedApp.getViewer();
        model.viewer = viewer3D;
        model.app = this.sharedApp;
        model.loaded = true;
        this.modelLoaded = true;
        this.$set(this.bimViewers, model.id, viewer3D);
        this.showToast("success", `${model.name} 加载成功`);

        // addView 后获取该模型的楼层树并缓存
        this.fetchModelTreeForModel(model, viewer3D, 0);
      } catch (e) {
        console.error(`${model.name} addView失败:`, e);
      }
      this.addViewsSequentially(models, index + 1);
    },

    // 获取单个模型的楼层树并缓存
    fetchModelTreeForModel(modelListItem, viewer3D, attempt) {
      const self = this;
      if (attempt > 10) return;
      try {
        const modelData = viewer3D.getModel();
        if (modelData && modelData.getModelTree) {
          modelData.getModelTree((tree) => {
            if (tree && tree.length > 0) {
              // 按模型 ID 缓存楼层树
              self.$set(self.modelFloors, modelListItem.id, tree);
              // 合并到 allFloorData
              self.allFloorData = Object.values(self.modelFloors).flat();
            } else {
              self.trackTimeout(
                () =>
                  self.fetchModelTreeForModel(
                    modelListItem,
                    viewer3D,
                    attempt + 1
                  ),
                1000
              );
            }
          });
        } else {
          self.trackTimeout(
            () =>
              self.fetchModelTreeForModel(modelListItem, viewer3D, attempt + 1),
            1000
          );
        }
      } catch (e) {
        self.trackTimeout(
          () =>
            self.fetchModelTreeForModel(modelListItem, viewer3D, attempt + 1),
          1000
        );
      }
    },

    // 初始化 viewer 设置：窗口自适应、初始视角、点击事件监听
    setupViewer() {
      const self = this;
      const viewer = this.sharedViewer;
      if (!viewer) return;

      // 窗口大小变化时自适应
      window.onresize = () => {
        viewer.resize(
          document.documentElement.clientWidth,
          document.documentElement.clientHeight - 40
        );
      };

      // 延迟设置初始视角（等待模型渲染完成），避免先 render 再 setView 导致的闪现缩放
      this.trackTimeout(() => {
        viewer.setView(Glodon.Bimface.Viewer.ViewOption.Home);
        viewer.render();
      }, 500);

      // 绑定点击事件：点击构件触发 focusOnObject，点击空白触发 resetFloorVisibility
      this.viewerClickHandler = (evt) => {
        if (evt.normal !== null) {
          self.focusOnObject(evt);
        } else {
          self.resetFloorVisibility();
        }
      };
      viewer.addEventListener(
        Glodon.Bimface.Viewer.Viewer3DEvent.MouseClicked,
        this.viewerClickHandler
      );

      // 如果是从维修详情页跳转过来的，延迟2秒后自动定位到指定构件
      if (this.pendingFocusId) {
        this.trackTimeout(() => {
          self.focusOnComponent(self.pendingFocusId);
        }, 2000);
      }
    },

    // ========================= 构件定位 =========================

    // 从维修详情页跳转过来时，自动定位到指定构件
    // 流程：遍历模型找构件 → 分离楼层 → 选中+高亮 → 俯视缩放
    focusOnComponent(elementId) {
      const self = this;
      const viewer = this.sharedViewer;
      if (!viewer || !elementId) return;

      const models = viewer.getModels();
      if (!models || models.length === 0) return;

      const id = String(elementId);

      // 遍历所有模型，找到包含该构件的模型
      for (let i = 0; i < models.length; i++) {
        const model = models[i];
        const bbox = model.getBoundingBoxById(id);
        if (bbox) {
          // 隐藏其他模型，只显示当前模型
          models.forEach((m) => m.setVisible(m === model));

          // 获取被点击模型的楼层树，回调内执行楼层分离和面板填充
          model.getModelTree((tree) => {
            if (tree && tree.length > 0) {
              self.floorData = tree;
              self.currentFloorModel = model;

              // 用回调中的 tree 查找构件所在楼层
              const floor = self.findFloorInTree(tree, elementId);
              if (
                floor &&
                model.hideComponentsByObjectData &&
                model.showComponentsByObjectData
              ) {
                model.hideComponentsByObjectData(
                  tree.map((f) => ({ levelName: f.actualName }))
                );
                model.showComponentsByObjectData([
                  { levelName: floor.actualName },
                ]);
                self.selectFloorData = floor.actualName;
              }

              // 填充右侧构件信息面板
              const modelIndex = models.indexOf(model);
              const matchedModel =
                self.modelList[modelIndex] ||
                self.modelList.find((m) => m.loaded);
              const floorName = floor? floor.name || floor.actualName : "自动识别";
              const room = self.findRoomInFloor(floor, elementId);
              // const roomName = room ? room.name || room.actualName : "未知房间";
              const familyType = self.findFamilyType(floor, elementId);
              const familyTypeName = familyType || "";
              if (model.getComponentNameById) {
                model.getComponentNameById(elementId, (name) => {
                  self.selectedElement = {
                    id: id,
                    name: name || "构件#" + id,
                    floor: floorName,
                    room: familyTypeName,
                    modelName: matchedModel ? matchedModel.name : "",
                  };
                  self.activeTab = "element";
                });
              } else {
                self.selectedElement = {
                  id: id,
                  name: "构件#" + id,
                  floor: floorName,
                  room: familyTypeName,
                  modelName: matchedModel ? matchedModel.name : "",
                };
                self.activeTab = "element";
              }

              // 查询该构件关联的维修记录
              self.fetchElementRecords(id);
              self.showToast("info", `已定位到构件 #${id}`);
            }
          });

          // 选中构件
          model.clearSelectedComponents();
          model.setSelectedComponentsById([id]);

          // 蓝色高亮着色（改用选中高亮，可被 clearSelectedComponents 清除）
          // 不再使用 overrideComponentsColorById，因为它无法清除

          // 俯视缩放聚焦（与楼层选择的旋转方式一致）
          if (viewer.setCameraType) {
            viewer.setCameraType("OrthographicCamera");
          }
          if (
            viewer.getCamera &&
            viewer.getCamera() &&
            viewer.getCamera().zoomToBoundingBox
          ) {
            viewer.getCamera().zoomToBoundingBox({
              boundingBox: bbox,
              margin: 0.3,
              duration: 1000,
              direction: { x: 0, y: 0, z: -1 }, // 俯视方向
            });
          } else {
            model.zoomToSelectedComponents(1, null, 1000);
          }
          return;
        }
      }

      self.showToast("warning", "未找到该构件，可能不在当前加载的模型中");
    },

    // 递归收集楼层树节点下所有构件的 elementId
    collectElementIds(node, ids) {
      ids = ids || [];
      if (node.elementIds && node.elementIds.length > 0)
        ids.push(...node.elementIds);
      if (node.items && node.items.length > 0)
        node.items.forEach((child) => this.collectElementIds(child, ids));
      return ids;
    },

    // 根据 elementId 查找所属楼层
    findFloorByElementId(elementId) {
      const data =
        this.floorData.length > 0 ? this.floorData : this.allFloorData;
      if (!data || data.length === 0) return null;
      const id = String(elementId);
      for (const floor of data) {
        const ids = this.collectElementIds(floor);
        if (ids.some((i) => String(i) === id)) return floor;
      }
      return null;
    },

    // 在指定的楼层树中查找构件所在楼层（用于 getModelTree 回调内）
    findFloorInTree(tree, elementId) {
      if (!tree || tree.length === 0) return null;
      const id = String(elementId);
      for (const floor of tree) {
        const ids = this.collectElementIds(floor);
        if (ids.some((i) => String(i) === id)) return floor;
      }
      return null;
    },

    // 在楼层内查找构件所在的房间
    findRoomInFloor(floor, elementId) {
      if (!floor || !floor.items || floor.items.length === 0) return null;
      const id = String(elementId);
      for (const room of floor.items) {
        const ids = this.collectElementIds(room);
        if (ids.some((i) => String(i) === id)) return room;
      }
      return null;
    },

    // 在楼层内递归查找构件所属的族类型名称（如"1500 x 2400mm"）
    findFamilyType(floor, elementId) {
      if (!floor || !floor.items) return null;
      const id = String(elementId);
      for (const item of floor.items) {
        if (item.type === "familyType") {
          const ids = this.collectElementIds(item);
          if (ids.some((i) => String(i) === id)) {
            return item.name || item.actualName;
          }
        }
        if (item.items && item.items.length > 0) {
          const result = this.findFamilyType(item, id);
          if (result) return result;
        }
      }
      return null;
    },

    // ========================= 点击交互 =========================

    // 点击模型中的构件时触发：高亮选中 + 缩放聚焦 + 填充楼层下拉框
    focusOnObject(event) {
      const self = this;
      const { objectId, fileId } = event;
      const viewer = this.sharedViewer;
      if (!viewer) return;

      const models = viewer.getModels();
      if (!models || models.length === 0) return;

      const targetFileId = String(fileId);
      models.forEach((model) =>
        model.setVisible(String(model.modelId) === targetFileId)
      );
      const model = models.find((m) => String(m.modelId) === targetFileId);
      if (!model) return;

      // 选中构件并缩放
      const id =
        objectId != null
          ? typeof objectId === "string"
            ? objectId
            : String(objectId)
          : "";
      const bbox = model.getBoundingBoxById(id);
      if (bbox) {
        model.clearSelectedComponents();
        model.setSelectedComponentsById([id]);
        model.zoomToSelectedComponents(1, null, 1000);
      }

      // 获取被点击模型的楼层树，回调内执行面板填充
      model.getModelTree((tree) => {
        if (tree && tree.length > 0) {
          self.floorData = tree;
          self.currentFloorModel = model;
          const floor = self.findFloorInTree(tree, objectId);
          if (floor) {
            self.selectFloorData = floor.actualName;
          }

          // 填充右侧构件信息面板
          const modelIndex = models.indexOf(model);
          const matchedModel =
            self.modelList[modelIndex] || self.modelList.find((m) => m.loaded);
          const floorName = floor ? floor.name || floor.actualName : "自动识别";
          const room = self.findRoomInFloor(floor, objectId);
          const roomName = room ? room.name || room.actualName : "未知房间";
          const familyType = self.findFamilyType(floor, objectId);
          const familyTypeName = familyType || "";
          const applyElementInfo = (name) => {
            self.selectedElement = {
              id: String(objectId),
              name: name || "构件#" + objectId,
              floor: floorName,
              room: familyTypeName,
              modelName: matchedModel ? matchedModel.name : "",
            };
            self.fetchElementRecords(self.selectedElement.id);
            self.activeTab = "element";
          };

          // 获取构件名称（异步）
          if (model.getComponentNameById) {
            model.getComponentNameById(objectId, applyElementInfo);
          } else {
            applyElementInfo(null);
          }
        }
      });
    },

    // ========================= 楼层切换 =========================

    // 切换楼层：隐藏所有楼层 → 显示选中楼层 → 俯视缩放到该楼层
    handleFloorChange(floorId) {
      const viewer = this.sharedViewer;
      if (!viewer || !this.floorData || this.floorData.length === 0) return;

      // 使用当前点击模型对应的 viewer，而非 models[0]
      const model = this.currentFloorModel || viewer.getModels()[0];
      if (!model) return;

      // 先隐藏所有楼层
      model.hideComponentsByObjectData(
        this.floorData.map((f) => ({ levelName: f.actualName }))
      );

      // 再显示选中的楼层
      const selectedFloor = this.floorData.find(
        (f) => f.actualName === floorId
      );
      if (selectedFloor) {
        model.showComponentsByObjectData([
          { levelName: selectedFloor.actualName },
        ]);

        // 计算该楼层所有构件的合并 boundingBox
        const ids = this.collectElementIds(selectedFloor);
        let floorBbox = null;
        ids.forEach((id) => {
          const bbox = model.getBoundingBoxById(String(id));
          if (bbox) {
            if (!floorBbox) {
              floorBbox = { min: { ...bbox.min }, max: { ...bbox.max } };
            } else {
              floorBbox.min.x = Math.min(floorBbox.min.x, bbox.min.x);
              floorBbox.min.y = Math.min(floorBbox.min.y, bbox.min.y);
              floorBbox.min.z = Math.min(floorBbox.min.z, bbox.min.z);
              floorBbox.max.x = Math.max(floorBbox.max.x, bbox.max.x);
              floorBbox.max.y = Math.max(floorBbox.max.y, bbox.max.y);
              floorBbox.max.z = Math.max(floorBbox.max.z, bbox.max.z);
            }
          }
        });

        // 俯视缩放到该楼层
        if (floorBbox && viewer.getCamera && viewer.getCamera()) {
          viewer.setCameraType("OrthographicCamera");
          viewer.getCamera().zoomToBoundingBox({
            boundingBox: floorBbox,
            margin: 0.2,
            duration: 1000,
            direction: { x: 0, y: 0, z: -1 }, // 俯视方向
          });
        }
      }
      viewer.render();
    },

    // 重置楼层选择：清空下拉框数据 + 清空构件信息 + 恢复全景
    resetFloorSelection() {
      // 先恢复视图，再清空数据
      this.resetFloorVisibility();
      this.selectFloorData = "";
      this.floorData = [];
      this.currentFloorModel = null;
      this.pendingFocusId = null;
      // 清除 URL 中的 model_element_id 参数，防止刷新后重新定位
      if (this.$route.query.model_element_id) {
        this.$router.replace({ path: this.$route.path });
      }
      this.selectedElement = {
        id: "",
        name: "",
        floor: "",
        room: "",
        modelName: "",
        familyType: "",
      };
      this.elementRecords = [];
    },

    // 恢复楼层可见性：显示所有楼层 + 所有模型 + 清除高亮 + 回到 Home 视角
    resetFloorVisibility() {
      const viewer = this.sharedViewer;
      if (!viewer) return;

      const models = viewer.getModels();
      models.forEach((m) => {
        if (m.clearSelectedComponents) m.clearSelectedComponents();
        m.setVisible(true);
      });
      // 恢复当前模型所有楼层的可见性，防止 setView(Home) 重置后楼层仍被隐藏
      const model = this.currentFloorModel || viewer.getModels()[0];
      if (model && this.floorData.length > 0) {
        model.showComponentsByObjectData(
          this.floorData.map((f) => ({ levelName: f.actualName }))
        );
      }
      viewer.setView(Glodon.Bimface.Viewer.ViewOption.Home);
      viewer.render();
    },

    // ========================= 降级方案 =========================

    // SDK 不可用时，用 iframe 方式加载模型（降级方案）
    loadByIframeFallback(modelsToLoad) {
      const container = document.getElementById("bim-container");
      if (!container) return;
      modelsToLoad.forEach((model, i) => {
        const modelDiv = document.createElement("div");
        modelDiv.id = `model-${model.id}`;
        modelDiv.style.width = "100%";
        modelDiv.style.height = "100%";
        modelDiv.style.position = "absolute";
        modelDiv.style.top = "0";
        modelDiv.style.left = "0";
        modelDiv.style.zIndex = String(i + 1);
        container.appendChild(modelDiv);

        const iframe = document.createElement("iframe");
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.border = "none";
        iframe.allow =
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.src = `https://api.bimface.com/external/viewer?token=${model.token}`;
        modelDiv.appendChild(iframe);

        model.loaded = true;
        this.modelLoaded = true;
        this.$set(this.bimViewers, model.id, {
          type: "iframe",
          element: iframe,
        });
        this.showToast("success", `${model.name} 已加载`);
      });
    },

    // ========================= 数据查询 =========================

    // 查询构件关联的维修记录
    async fetchElementRecords(model_element_id) {
      try {
        const res = await this.$API.maintenanceApi.getByElement(
          model_element_id
        );
        if (res.code === 200) {
          this.elementRecords = res.data;
        }
      } catch (e) {
        this.$message.error(e);
      }
    },

    // 跳转到维修页面，传递构件信息
    goCreateRecord() {
      const from = this.$route.query.from;
      const recordId = this.$route.query.record_id;
      this.$router.push({
        path:
          from === "edit"
            ? `/maintenance/edit/${recordId}`
            : "/maintenance/create",
        query: {
          model_element_id: this.selectedElement.id,
          model_element_name: this.selectedElement.name,
          floor: this.selectedElement.floor,
          room: this.selectedElement.room,
          model_name: this.selectedElement.modelName,
          family_type: this.selectedElement.familyType,
        },
      });
    },
  },
};
</script>

<style scoped lang="scss">
.bim-container {
  height: calc(100vh - 120px);
  overflow: hidden;
}

.model-viewer {
  height: 100%;
  position: relative;
  background: #1a1a2e;
  border-radius: 8px;
  overflow: hidden;
}

.viewer-toolbar {
  height: 50px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 10;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.floor-select {
  width: 160px;
}

.model-placeholder {
  position: absolute;
  top: 50px;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.side-panel {
  height: 100%;
  padding: 16px;
  background: #fff;
  border-left: 1px solid #e6e6e6;
  overflow-y: auto;
  border-radius: 0 8px 8px 0;
}

.element-info {
  padding-top: 12px;
}

.record-card {
  margin-bottom: 10px;

  .record-title {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 6px;
  }
  .record-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .record-time {
    font-size: 12px;
    color: #909399;
  }
}

.model-status-list {
  margin-top: 16px;
  border-top: 1px solid #e6e6e6;
  padding-top: 12px;
}

.model-status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;

  .model-name {
    font-size: 13px;
    color: #606266;
  }
}

/* BIMface SDK 内置工具栏缩小 */
.bf-toolbar {
  transform: scale(0.3);
  transform-origin: left bottom;
}
</style>
