import { useEffect, useRef, useState } from 'react';
import { Check, Download, FileDown, Upload } from 'lucide-react';
import { db } from '../db';
import { downloadErrorReport, downloadImportTemplate, parseImportFile, type ParsedImport } from '../utils/excel';
import { Modal } from './Modal';
import { useToast } from './Toast';

type Step = 'upload' | 'check' | 'result';

export function ImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState<Step>('upload');
  const [parsed, setParsed] = useState<ParsedImport | null>(null);
  const [okCount, setOkCount] = useState(0);
  const [parsing, setParsing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setStep('upload');
      setParsed(null);
      setParsing(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }, [open]);

  const handleFile = async (f: File | undefined) => {
    if (!f) return;
    setParsing(true);
    try {
      const existing = await db.customers.toArray();
      const result = await parseImportFile(f, new Set(existing.map((c) => c.customerNo)));
      setParsed(result);
      setStep('check');
    } finally {
      setParsing(false);
    }
  };

  const apply = async (mode: 'overwrite' | 'skip') => {
    if (!parsed) return;
    const existing = await db.customers.toArray();
    await db.transaction('rw', db.customers, async () => {
      for (const row of parsed.rows) {
        await db.customers.add({ ...row, createdAt: Date.now() });
      }
      if (mode === 'overwrite') {
        for (const dup of parsed.duplicates) {
          const ex = existing.find((c) => c.customerNo === dup.customerNo);
          if (ex?.id != null) {
            await db.customers.update(ex.id, {
              displayName: dup.row.displayName,
              birthday: dup.row.birthday,
              gender: dup.row.gender,
              industry: dup.row.industry,
              level: dup.row.level,
              remark: dup.row.remark,
            });
          }
        }
      }
    });
    setOkCount(parsed.rows.length + (mode === 'overwrite' ? parsed.duplicates.length : 0));
    setStep('result');
  };

  const finish = () => {
    toast.show(`导入完成：成功 ${okCount} 条，失败 ${parsed?.errors.length ?? 0} 条`);
    onClose();
  };

  return (
    <Modal open={open} title="批量导入" onClose={onClose}>
      <div className="steps">
        <div className={`step${step === 'upload' ? ' active' : ''}`}><i>1</i>上传</div>
        <div className={`step${step === 'check' ? ' active' : ''}`}><i>2</i>校验</div>
        <div className={`step${step === 'result' ? ' active' : ''}`}><i>3</i>结果</div>
      </div>

      {step === 'upload' && (
        <div>
          <p className="muted-p">下载模板填写客户信息，再上传 Excel 文件（.xlsx / .xls）。生日支持 YYYY-MM-DD 或 MM-DD（无年份）。</p>
          <div className="row-actions">
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => {
                downloadImportTemplate();
                toast.show('模板已生成：客户生日关怀助手_导入模板.xlsx');
              }}
            >
              <Download size={14} /> 下载模板
            </button>
            <label className="btn btn-primary btn-sm">
              <Upload size={14} /> {parsing ? '解析中…' : '选择文件'}
              <input ref={fileRef} type="file" accept=".xlsx,.xls" hidden onChange={(e) => void handleFile(e.target.files?.[0])} />
            </label>
          </div>
        </div>
      )}

      {step === 'check' && parsed && (
        <div>
          <div className="result-nums">
            <span><b>{parsed.rows.length + parsed.duplicates.length}</b><small>可导入</small></span>
            <span><b>{parsed.errors.length}</b><small>失败</small></span>
            <span><b>{parsed.duplicates.length}</b><small>重复</small></span>
          </div>
          {parsed.errors.length > 0 && (
            <div className="errors">
              {parsed.errors.slice(0, 5).map((e) => (
                <div key={`${e.line}-${e.message}`}><span className="line">第{e.line}行</span>{e.message}</div>
              ))}
              {parsed.errors.length > 5 ? <div>…共 {parsed.errors.length} 条错误，可下载错误报告查看</div> : null}
            </div>
          )}
          {parsed.duplicates.length > 0 && (
            <p className="dupe">发现重复客户：{parsed.duplicates.map((d) => d.customerNo).join('、')}，请选择处理方式：</p>
          )}
          <div className="row-actions">
            <button type="button" className="btn btn-sm" onClick={() => void apply('skip')}>跳过</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => void apply('overwrite')}>覆盖</button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>取消</button>
          </div>
        </div>
      )}

      {step === 'result' && (
        <div>
          <div className="result-done">导入完成</div>
          <div className="result-nums">
            <span><b>{okCount}</b><small>成功</small></span>
            <span><b>{parsed?.errors.length ?? 0}</b><small>失败</small></span>
          </div>
          <div className="row-actions">
            {parsed && parsed.errors.length > 0 && (
              <button type="button" className="btn btn-sm" onClick={() => downloadErrorReport(parsed.errors)}>
                <FileDown size={14} /> 下载错误报告
              </button>
            )}
            <button type="button" className="btn btn-primary btn-sm" onClick={finish}><Check size={14} /> 完成</button>
          </div>
        </div>
      )}
    </Modal>
  );
}
