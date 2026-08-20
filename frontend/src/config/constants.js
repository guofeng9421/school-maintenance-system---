// 维修记录状态、优先级、分类的统一映射
export const statusMap = { pending: '待处理', processing: '处理中', completed: '已完成', rejected: '已驳回' }
export const statusType = { pending: 'warning', processing: '', completed: 'success', rejected: 'danger' }


export const categoryMap = {
  electrical: '电气', plumbing: '水暖', furniture: '家具',
  door_window: '门窗', floor: '地面', wall: '墙面', other: '其他'
}

export const roleMap = { admin: '管理员', teacher: '教师', student: '学生', maintenance: '维修人员' }
