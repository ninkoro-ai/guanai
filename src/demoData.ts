import { demoDb, type ContactRecord, type Customer, type FamilyMember } from './db';

/**
 * 内嵌演示数据：覆盖产品全部可演示功能（今日生日 5 位、未来 7 天、全等级/行业/性别、
 * 星标、生日画像标签、家属关系、历史维护记录等），与真实用户数据完全隔离。
 */

const T = 1785916800000; // 固定创建时间戳，保证演示数据稳定

export const DEMO_CUSTOMERS: Array<Customer & { id: number }> = [
  { id: 1, customerNo: 'C20260001', displayName: '刘先生', birthday: '1978-08-05', gender: '男', industry: '制造业', level: 'A', remark: '合作5年以上，喜欢茶文化', company: '华兴制造集团', position: '总经理', starred: true, createdAt: T },
  { id: 2, customerNo: 'C20260002', displayName: '陈先生', birthday: '1966-08-05', gender: '男', industry: '房地产', level: 'A', remark: '授信续期洽谈中', company: '恒信地产', position: '董事长', starred: false, createdAt: T },
  { id: 3, customerNo: 'C20260003', displayName: '周女士', birthday: '1990-08-05', gender: '女', industry: '服务业', level: 'B', remark: '对公加私行客户', company: '云溪餐饮', position: '创始人', starred: false, createdAt: T },
  { id: 4, customerNo: 'C20260004', displayName: '何先生', birthday: '08-05', gender: '男', industry: '批发零售', level: 'B', remark: '关注结算账户', company: '丰汇商贸', position: '总经理', starred: true, createdAt: T },
  { id: 5, customerNo: 'C20260005', displayName: '王女士', birthday: '1988-08-05', gender: '女', industry: '信息技术', level: 'C', remark: '关注理财', company: '蓝海科技', position: '联合创始人', starred: true, createdAt: T },
  { id: 6, customerNo: 'C20260006', displayName: '吴先生', birthday: '1982-08-06', gender: '男', industry: '批发零售', level: 'A', remark: '合作多年', company: '丰汇商贸', position: '财务总监', starred: false, createdAt: T },
  { id: 7, customerNo: 'C20260007', displayName: '林先生', birthday: '1991-08-08', gender: '男', industry: '金融业', level: 'A', remark: '同业往来', company: '宏远金融', position: '部门经理', starred: false, createdAt: T },
  { id: 8, customerNo: 'C20260008', displayName: '张女士', birthday: '1979-08-10', gender: '女', industry: '建筑业', level: 'B', remark: '关注对公结算', company: '中建五局', position: '项目负责人', starred: false, createdAt: T },
  { id: 9, customerNo: 'C20260009', displayName: '黄先生', birthday: '08-11', gender: '男', industry: '制造业', level: 'C', remark: '小微贷款客户', company: '华兴制造集团', position: '采购经理', starred: true, createdAt: T },
  { id: 10, customerNo: 'C20260010', displayName: '李女士', birthday: '08-12', gender: '女', industry: '服务业', level: 'C', remark: '喜欢茶文化', company: '云溪餐饮', position: '合伙人', starred: false, createdAt: T },
  { id: 11, customerNo: 'C20260011', displayName: '蔡先生', birthday: '1976-08-14', gender: '男', industry: '金融业', level: 'A', remark: '融资租赁公司高管', company: '宏远金融', position: '高管', starred: false, createdAt: T },
  { id: 12, customerNo: 'C20260012', displayName: '郑先生', birthday: '1984-08-18', gender: '男', industry: '制造业', level: 'C', remark: '外贸工厂主', company: '华兴制造集团', position: '工厂主', starred: false, createdAt: T },
  { id: 13, customerNo: 'C20260013', displayName: '孙女士', birthday: '1987-08-20', gender: '女', industry: '房地产', level: 'A', remark: '企业财务负责人', company: '恒信地产', position: '财务负责人', starred: false, createdAt: T },
  { id: 14, customerNo: 'C20260014', displayName: '钱先生', birthday: '1980-08-25', gender: '男', industry: '信息技术', level: 'A', remark: '企业负责人', company: '蓝海科技', position: 'CEO', starred: false, createdAt: T },
  { id: 15, customerNo: 'C20260015', displayName: '赵女士', birthday: '08-28', gender: '女', industry: '其他', level: 'B', remark: '公益基金会理事', company: '心桥公益基金会', position: '理事', starred: false, createdAt: T },
  { id: 16, customerNo: 'C20260016', displayName: '余女士', birthday: '1989-08-30', gender: '女', industry: '服务业', level: 'B', remark: '月子中心负责人', company: '云溪餐饮', position: '负责人', starred: false, createdAt: T },
  { id: 17, customerNo: 'C20260017', displayName: '冯先生', birthday: '1986-09-02', gender: '男', industry: '金融业', level: 'B', remark: '同业合作', company: '宏远金融', position: '高管', starred: false, createdAt: T },
  { id: 18, customerNo: 'C20260018', displayName: '许女士', birthday: '1992-09-15', gender: '女', industry: '服务业', level: 'C', remark: '连锁门店负责人', company: '云溪餐饮', position: '区域负责人', starred: false, createdAt: T },
  { id: 19, customerNo: 'C20260019', displayName: '蒋先生', birthday: '1977-09-22', gender: '男', industry: '建筑业', level: 'A', remark: '工程款结算需求', company: '中建五局', position: '项目负责人', starred: false, createdAt: T },
  { id: 20, customerNo: 'C20260020', displayName: '葛先生', birthday: '1970-09-12', gender: '男', industry: '建筑业', level: 'C', remark: '施工队负责人', company: '中建五局', position: '负责人', starred: false, createdAt: T },
  { id: 21, customerNo: 'C20260021', displayName: '沈女士', birthday: '1989-10-06', gender: '女', industry: '制造业', level: 'B', remark: '供应商合作', company: '华兴制造集团', position: '采购总监', starred: false, createdAt: T },
  { id: 22, customerNo: 'C20260022', displayName: '韩先生', birthday: '1972-10-18', gender: '男', industry: '房地产', level: 'A', remark: '楼盘按揭合作', company: '恒信地产', position: '总经理', starred: false, createdAt: T },
  { id: 23, customerNo: 'C20260023', displayName: '杨女士', birthday: '1994-10-28', gender: '女', industry: '信息技术', level: 'C', remark: '关注跨境支付', company: '蓝海科技', position: '创始人', starred: false, createdAt: T },
  { id: 24, customerNo: 'C20260024', displayName: '范女士', birthday: '1988-10-15', gender: '女', industry: '批发零售', level: 'A', remark: '区域总代理', company: '丰汇商贸', position: '总经理', starred: false, createdAt: T },
  { id: 25, customerNo: 'C20260025', displayName: '朱先生', birthday: '1968-11-02', gender: '男', industry: '批发零售', level: 'A', remark: '商会副会长', company: '丰汇商贸', position: '商会副会长', starred: true, createdAt: T },
  { id: 26, customerNo: 'C20260026', displayName: '秦女士', birthday: '1985-11-15', gender: '女', industry: '金融业', level: 'B', remark: '私人银行客户', company: '宏远金融', position: '私行客户', starred: false, createdAt: T },
  { id: 27, customerNo: 'C20260027', displayName: '尤先生', birthday: '1977-11-25', gender: '男', industry: '其他', level: 'C', remark: '自由职业', starred: true, createdAt: T },
  { id: 28, customerNo: 'C20260028', displayName: '彭先生', birthday: '1981-11-08', gender: '男', industry: '房地产', level: 'B', remark: '写字楼业主', company: '恒信地产', position: '业主', starred: false, createdAt: T },
  { id: 29, customerNo: 'C20260029', displayName: '吕女士', birthday: '1990-12-08', gender: '女', industry: '服务业', level: 'B', remark: '餐饮品牌合伙人', company: '云溪餐饮', position: '合伙人', starred: false, createdAt: T },
  { id: 30, customerNo: 'C20260030', displayName: '苏先生', birthday: '1983-12-16', gender: '男', industry: '制造业', level: 'A', remark: '集团财务总监', company: '华兴制造集团', position: '财务总监', starred: false, createdAt: T },
  { id: 31, customerNo: 'C20260031', displayName: '潘女士', birthday: '1995-12-25', gender: '女', industry: '信息技术', level: 'B', remark: '初创企业联合创始人', company: '蓝海科技', position: '联合创始人', starred: true, createdAt: T },
  { id: 32, customerNo: 'C20260032', displayName: '董女士', birthday: '1992-12-01', gender: '女', industry: '其他', level: 'C', remark: '自媒体创业者', starred: false, createdAt: T },
  { id: 33, customerNo: 'C20260033', displayName: '孔女士', birthday: '1985-11-20', gender: '未知', industry: '其他', level: 'C', remark: '港澳客户，委托亲属对接', starred: false, createdAt: T },
  { id: 34, customerNo: 'C20260034', displayName: '欧阳先生', birthday: '1988-09-18', gender: '男', industry: '金融业', level: 'B', remark: '基金公司渠道', company: '宏远金融', position: '渠道经理', starred: false, createdAt: T },
];

/** 家属关系：含已关联客户（双向自动同步）与仅登记姓名的自由条目 */
export const DEMO_FAMILY: Array<Omit<FamilyMember, 'id'>> = [
  // 已关联：刘先生 ↔ 周女士（夫妻）
  { customerId: 1, displayName: '周女士', relationType: '夫妻', linkedCustomerId: 3, remark: '', createdAt: T },
  { customerId: 3, displayName: '刘先生', relationType: '夫妻', linkedCustomerId: 1, remark: '', createdAt: T },
  // 已关联：王女士 ↔ 吴先生（夫妻）
  { customerId: 5, displayName: '吴先生', relationType: '夫妻', linkedCustomerId: 6, remark: '', createdAt: T },
  { customerId: 6, displayName: '王女士', relationType: '夫妻', linkedCustomerId: 5, remark: '', createdAt: T },
  // 已关联：苏先生 ↔ 秦女士（夫妻）
  { customerId: 30, displayName: '秦女士', relationType: '夫妻', linkedCustomerId: 26, remark: '', createdAt: T },
  { customerId: 26, displayName: '苏先生', relationType: '夫妻', linkedCustomerId: 30, remark: '', createdAt: T },
  // 已关联：何先生 ↔ 李女士（夫妻）
  { customerId: 4, displayName: '李女士', relationType: '夫妻', linkedCustomerId: 10, remark: '', createdAt: T },
  { customerId: 10, displayName: '何先生', relationType: '夫妻', linkedCustomerId: 4, remark: '', createdAt: T },
  // 仅登记姓名（自由条目，演示关系备注）
  { customerId: 1, displayName: '小刘', relationType: '子女', remark: '在海外读书', createdAt: T },
  { customerId: 2, displayName: '陈小雅', relationType: '子女', remark: '即将接班，关注公司治理', createdAt: T },
  { customerId: 13, displayName: '孙母', relationType: '父母', remark: '关注养老理财', createdAt: T },
  { customerId: 25, displayName: '朱太太', relationType: '夫妻', remark: '喜欢茶文化，可作礼品参考', createdAt: T },
];

/** 维护记录：演示“历史维护记录”与“今日已维护/已联系”状态 */
export const DEMO_RECORDS: Array<Omit<ContactRecord, 'id'>> = [
  { customerId: 1, contactDate: '2026-08-05', contactType: '电话', remark: '客户表示感谢，已预约回访', createdAt: T },
  { customerId: 1, contactDate: '2026-07-05', contactType: '微信', remark: '发送新政策解读，客户有兴趣', createdAt: T },
  { customerId: 5, contactDate: '2026-08-01', contactType: '微信', remark: '沟通理财配置意向', createdAt: T },
  { customerId: 30, contactDate: '2026-07-20', contactType: '电话', remark: '集团授信方案初步沟通', createdAt: T },
  { customerId: 3, contactDate: '2026-08-02', contactType: '电话', remark: '介绍私行权益，客户感兴趣', createdAt: T },
];

/** 幂等填充演示数据库：每次调用先清空再写入，保证演示数据可重复、稳定 */
export async function seedDemoData(): Promise<void> {
  await demoDb.transaction('rw', demoDb.customers, demoDb.familyMembers, demoDb.records, async () => {
    await demoDb.customers.clear();
    await demoDb.familyMembers.clear();
    await demoDb.records.clear();
    await demoDb.customers.bulkAdd(DEMO_CUSTOMERS);
    await demoDb.familyMembers.bulkAdd(DEMO_FAMILY);
    await demoDb.records.bulkAdd(DEMO_RECORDS);
  });
}
