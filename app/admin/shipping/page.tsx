"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import {
  createAdminShippingMethod,
  createAdminShippingRate,
  createAdminShippingZone,
  deleteAdminShippingMethod,
  deleteAdminShippingRate,
  deleteAdminShippingZone,
  formatVnd,
  getAdminShippingMethods,
  getAdminShippingRates,
  getAdminShippingZones,
  setAdminShippingActive,
  updateAdminShippingMethod,
  updateAdminShippingRate,
  updateAdminShippingZone,
  type ShippingMethodRequest,
  type ShippingMethodResponse,
  type ShippingRateRequest,
  type ShippingRateResponse,
  type ShippingZoneRequest,
  type ShippingZoneResponse,
} from "@/lib/shop";

type Tab = "RATES" | "ZONES" | "METHODS";
type ModalState =
  | { type: "METHOD"; item?: ShippingMethodResponse }
  | { type: "ZONE"; item?: ShippingZoneResponse }
  | { type: "RATE"; item?: ShippingRateResponse }
  | null;

type MethodForm = { code: string; name: string; active: boolean };
type ZoneForm = { name: string; provinces: string; priority: string; active: boolean };
type RateForm = { zoneId: string; methodId: string; fee: string; minDays: string; maxDays: string; active: boolean };

const emptyMethod: MethodForm = { code: "", name: "", active: true };
const emptyZone: ZoneForm = { name: "", provinces: "", priority: "100", active: true };
const emptyRate: RateForm = { zoneId: "", methodId: "", fee: "30000", minDays: "2", maxDays: "4", active: true };

export default function AdminShippingPage() {
  const [tab, setTab] = useState<Tab>("RATES");
  const [methods, setMethods] = useState<ShippingMethodResponse[]>([]);
  const [zones, setZones] = useState<ShippingZoneResponse[]>([]);
  const [rates, setRates] = useState<ShippingRateResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  const [methodForm, setMethodForm] = useState<MethodForm>(emptyMethod);
  const [zoneForm, setZoneForm] = useState<ZoneForm>(emptyZone);
  const [rateForm, setRateForm] = useState<RateForm>(emptyRate);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [methodData, zoneData, rateData] = await Promise.all([
        getAdminShippingMethods(),
        getAdminShippingZones(),
        getAdminShippingRates(),
      ]);
      setMethods(methodData);
      setZones(zoneData);
      setRates(rateData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Không thể tải cấu hình giao hàng.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const stats = useMemo(() => ({
    activeMethods: methods.filter((item) => item.active).length,
    activeZones: zones.filter((item) => item.active).length,
    activeRates: rates.filter((item) => item.active).length,
  }), [methods, rates, zones]);

  const openCreate = () => {
    if (tab === "METHODS") {
      setMethodForm(emptyMethod);
      setModal({ type: "METHOD" });
    } else if (tab === "ZONES") {
      setZoneForm(emptyZone);
      setModal({ type: "ZONE" });
    } else {
      setRateForm({ ...emptyRate, zoneId: zones[0]?.id ? String(zones[0].id) : "", methodId: methods[0]?.id ? String(methods[0].id) : "" });
      setModal({ type: "RATE" });
    }
  };

  const openEditMethod = (item: ShippingMethodResponse) => {
    setMethodForm({ code: item.code, name: item.name, active: item.active });
    setModal({ type: "METHOD", item });
  };

  const openEditZone = (item: ShippingZoneResponse) => {
    setZoneForm({ name: item.name, provinces: item.provinces.join("\n"), priority: String(item.priority), active: item.active });
    setModal({ type: "ZONE", item });
  };

  const openEditRate = (item: ShippingRateResponse) => {
    setRateForm({ zoneId: String(item.zone.id), methodId: String(item.method.id), fee: String(item.fee), minDays: String(item.minDays), maxDays: String(item.maxDays), active: item.active });
    setModal({ type: "RATE", item });
  };

  const submitMethod = async (event: FormEvent) => {
    event.preventDefault();
    if (!modal || modal.type !== "METHOD") return;
    const payload: ShippingMethodRequest = { code: methodForm.code.trim().toUpperCase(), name: methodForm.name.trim(), active: methodForm.active };
    const key = modal.item ? `method-edit-${modal.item.id}` : "method-create";
    setBusyKey(key);
    try {
      if (modal.item) await updateAdminShippingMethod(modal.item.id, payload);
      else await createAdminShippingMethod(payload);
      toast.success(modal.item ? "Đã cập nhật phương thức giao hàng." : "Đã tạo phương thức giao hàng.");
      setModal(null);
      await loadData();
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : "Không thể lưu phương thức.");
    } finally {
      setBusyKey("");
    }
  };

  const submitZone = async (event: FormEvent) => {
    event.preventDefault();
    if (!modal || modal.type !== "ZONE") return;
    const provinces = [...new Set(zoneForm.provinces.split(/[\n,;]+/).map((value) => value.trim()).filter(Boolean))];
    const priority = Number(zoneForm.priority);
    if (provinces.length === 0) return toast.error("Hãy nhập ít nhất một tỉnh/thành.");
    if (!Number.isInteger(priority) || priority < 0) return toast.error("Độ ưu tiên phải là số nguyên không âm.");
    const payload: ShippingZoneRequest = { name: zoneForm.name.trim(), provinces, priority, active: zoneForm.active };
    const key = modal.item ? `zone-edit-${modal.item.id}` : "zone-create";
    setBusyKey(key);
    try {
      if (modal.item) await updateAdminShippingZone(modal.item.id, payload);
      else await createAdminShippingZone(payload);
      toast.success(modal.item ? "Đã cập nhật khu vực giao hàng." : "Đã tạo khu vực giao hàng.");
      setModal(null);
      await loadData();
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : "Không thể lưu khu vực.");
    } finally {
      setBusyKey("");
    }
  };

  const submitRate = async (event: FormEvent) => {
    event.preventDefault();
    if (!modal || modal.type !== "RATE") return;
    const payload: ShippingRateRequest = {
      zoneId: Number(rateForm.zoneId),
      methodId: Number(rateForm.methodId),
      fee: Number(rateForm.fee),
      minDays: Number(rateForm.minDays),
      maxDays: Number(rateForm.maxDays),
      active: rateForm.active,
    };
    if (!payload.zoneId || !payload.methodId) return toast.error("Hãy chọn khu vực và phương thức.");
    if (![payload.fee, payload.minDays, payload.maxDays].every((value) => Number.isInteger(value) && value >= 0)) return toast.error("Phí và số ngày phải là số nguyên không âm.");
    if (payload.minDays > payload.maxDays) return toast.error("Số ngày tối thiểu không được lớn hơn tối đa.");
    const key = modal.item ? `rate-edit-${modal.item.id}` : "rate-create";
    setBusyKey(key);
    try {
      if (modal.item) await updateAdminShippingRate(modal.item.id, payload);
      else await createAdminShippingRate(payload);
      toast.success(modal.item ? "Đã cập nhật bảng giá." : "Đã tạo bảng giá.");
      setModal(null);
      await loadData();
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : "Không thể lưu bảng giá.");
    } finally {
      setBusyKey("");
    }
  };

  const toggle = async (type: "methods" | "zones" | "rates", id: number, active: boolean) => {
    const key = `${type}-${id}`;
    setBusyKey(key);
    try {
      await setAdminShippingActive(type, id, active);
      toast.success(active ? "Đã kích hoạt cấu hình." : "Đã tạm ngưng cấu hình.");
      await loadData();
    } catch (toggleError) {
      toast.error(toggleError instanceof Error ? toggleError.message : "Không thể đổi trạng thái.");
    } finally {
      setBusyKey("");
    }
  };

  const remove = async (type: "METHOD" | "ZONE" | "RATE", id: number, label: string) => {
    if (!window.confirm(`Xóa “${label}”?`)) return;
    const key = `delete-${type}-${id}`;
    setBusyKey(key);
    try {
      if (type === "METHOD") await deleteAdminShippingMethod(id);
      else if (type === "ZONE") await deleteAdminShippingZone(id);
      else await deleteAdminShippingRate(id);
      toast.success("Đã xóa cấu hình giao hàng.");
      await loadData();
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : "Không thể xóa cấu hình.");
    } finally {
      setBusyKey("");
    }
  };

  return (
    <main className="space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#EE4D2D]">Vận chuyển</p><h1 className="mt-1 text-2xl font-extrabold text-gray-900">Quản lý giao hàng</h1><p className="mt-1 text-sm text-gray-500">Cấu hình phương thức, khu vực, phí và thời gian giao dự kiến.</p></div>
        <button type="button" onClick={openCreate} disabled={tab === "RATES" && (methods.length === 0 || zones.length === 0)} className="rounded-lg bg-[#EE4D2D] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50">+ Thêm {tab === "METHODS" ? "phương thức" : tab === "ZONES" ? "khu vực" : "bảng giá"}</button>
      </header>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      <section className="grid gap-4 sm:grid-cols-3"><Stat label="Phương thức đang bật" value={stats.activeMethods} total={methods.length} /><Stat label="Khu vực đang bật" value={stats.activeZones} total={zones.length} /><Stat label="Bảng giá đang bật" value={stats.activeRates} total={rates.length} /></section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex gap-2 border-b border-gray-200 p-4">
          {([['RATES', 'Bảng giá cước'], ['ZONES', 'Khu vực giao hàng'], ['METHODS', 'Phương thức giao hàng']] as Array<[Tab, string]>).map(([value, label]) => <button key={value} type="button" onClick={() => setTab(value)} className={`rounded-full px-4 py-2 text-sm font-bold ${tab === value ? "bg-[#EE4D2D] text-white" : "bg-gray-100 text-gray-600"}`}>{label}</button>)}
        </div>

        <div className="overflow-x-auto">
          {tab === "RATES" && <RatesTable loading={loading} rates={rates} busyKey={busyKey} onEdit={openEditRate} onToggle={(item) => void toggle("rates", item.id, !item.active)} onDelete={(item) => void remove("RATE", item.id, `${item.zone.name} - ${item.method.name}`)} />}
          {tab === "ZONES" && <ZonesTable loading={loading} zones={zones} busyKey={busyKey} onEdit={openEditZone} onToggle={(item) => void toggle("zones", item.id, !item.active)} onDelete={(item) => void remove("ZONE", item.id, item.name)} />}
          {tab === "METHODS" && <MethodsTable loading={loading} methods={methods} busyKey={busyKey} onEdit={openEditMethod} onToggle={(item) => void toggle("methods", item.id, !item.active)} onDelete={(item) => void remove("METHOD", item.id, item.name)} />}
        </div>
      </section>

      {modal?.type === "METHOD" && <Modal title={modal.item ? "Sửa phương thức" : "Thêm phương thức"} onClose={() => setModal(null)}><form onSubmit={submitMethod} className="space-y-4"><Field label="Mã phương thức"><input required maxLength={30} value={methodForm.code} onChange={(event) => setMethodForm((current) => ({ ...current, code: event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") }))} className="input" placeholder="STANDARD" /></Field><Field label="Tên hiển thị"><input required maxLength={100} value={methodForm.name} onChange={(event) => setMethodForm((current) => ({ ...current, name: event.target.value }))} className="input" placeholder="Giao hàng tiêu chuẩn" /></Field><ActiveCheckbox checked={methodForm.active} onChange={(active) => setMethodForm((current) => ({ ...current, active }))} /><ModalActions busy={Boolean(busyKey)} onCancel={() => setModal(null)} /></form></Modal>}

      {modal?.type === "ZONE" && <Modal title={modal.item ? "Sửa khu vực" : "Thêm khu vực"} onClose={() => setModal(null)}><form onSubmit={submitZone} className="space-y-4"><Field label="Tên khu vực"><input required maxLength={100} value={zoneForm.name} onChange={(event) => setZoneForm((current) => ({ ...current, name: event.target.value }))} className="input" placeholder="Nội thành" /></Field><Field label="Tỉnh/thành (mỗi dòng hoặc cách nhau bằng dấu phẩy)"><textarea required rows={6} value={zoneForm.provinces} onChange={(event) => setZoneForm((current) => ({ ...current, provinces: event.target.value }))} className="input" placeholder={'Hồ Chí Minh\nBình Dương'} /></Field><Field label="Độ ưu tiên (số nhỏ được khớp trước)"><input required type="number" min={0} value={zoneForm.priority} onChange={(event) => setZoneForm((current) => ({ ...current, priority: event.target.value }))} className="input" /></Field><ActiveCheckbox checked={zoneForm.active} onChange={(active) => setZoneForm((current) => ({ ...current, active }))} /><ModalActions busy={Boolean(busyKey)} onCancel={() => setModal(null)} /></form></Modal>}

      {modal?.type === "RATE" && <Modal title={modal.item ? "Sửa bảng giá" : "Thêm bảng giá"} onClose={() => setModal(null)}><form onSubmit={submitRate} className="space-y-4"><Field label="Khu vực"><select required value={rateForm.zoneId} onChange={(event) => setRateForm((current) => ({ ...current, zoneId: event.target.value }))} className="input"><option value="">Chọn khu vực</option>{zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}</select></Field><Field label="Phương thức"><select required value={rateForm.methodId} onChange={(event) => setRateForm((current) => ({ ...current, methodId: event.target.value }))} className="input"><option value="">Chọn phương thức</option>{methods.map((method) => <option key={method.id} value={method.id}>{method.name} ({method.code})</option>)}</select></Field><Field label="Phí giao hàng (VND)"><input required type="number" min={0} step={1000} value={rateForm.fee} onChange={(event) => setRateForm((current) => ({ ...current, fee: event.target.value }))} className="input" /></Field><div className="grid grid-cols-2 gap-3"><Field label="Số ngày tối thiểu"><input required type="number" min={0} value={rateForm.minDays} onChange={(event) => setRateForm((current) => ({ ...current, minDays: event.target.value }))} className="input" /></Field><Field label="Số ngày tối đa"><input required type="number" min={0} value={rateForm.maxDays} onChange={(event) => setRateForm((current) => ({ ...current, maxDays: event.target.value }))} className="input" /></Field></div><ActiveCheckbox checked={rateForm.active} onChange={(active) => setRateForm((current) => ({ ...current, active }))} /><ModalActions busy={Boolean(busyKey)} onCancel={() => setModal(null)} /></form></Modal>}

      <style jsx>{`.input{width:100%;border:1px solid #d1d5db;border-radius:.5rem;padding:.7rem .9rem;color:#111827;outline:none;background:white}.input:focus{border-color:#ee4d2d;box-shadow:0 0 0 1px #ee4d2d}`}</style>
    </main>
  );
}

function RatesTable({ loading, rates, busyKey, onEdit, onToggle, onDelete }: { loading: boolean; rates: ShippingRateResponse[]; busyKey: string; onEdit: (item: ShippingRateResponse) => void; onToggle: (item: ShippingRateResponse) => void; onDelete: (item: ShippingRateResponse) => void }) {
  return <table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr className="text-left text-xs font-bold uppercase tracking-wide text-gray-500"><th className="px-5 py-3">Khu vực</th><th className="px-5 py-3">Phương thức</th><th className="px-5 py-3">Phí</th><th className="px-5 py-3">Thời gian</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-gray-100">{loading ? <EmptyRow colSpan={6} text="Đang tải bảng giá..." /> : rates.length === 0 ? <EmptyRow colSpan={6} text="Chưa có bảng giá." /> : rates.map((item) => <tr key={item.id} className="hover:bg-gray-50"><td className="px-5 py-4 font-bold text-gray-900">{item.zone.name}</td><td className="px-5 py-4"><p className="font-semibold text-gray-800">{item.method.name}</p><p className="text-xs text-gray-500">{item.method.code}</p></td><td className="px-5 py-4 font-bold text-[#EE4D2D]">{formatVnd(item.fee)}</td><td className="px-5 py-4 text-sm text-gray-700">{item.minDays}–{item.maxDays} ngày</td><td className="px-5 py-4"><Status active={item.active} /></td><td className="px-5 py-4"><RowActions busy={busyKey.includes(String(item.id))} active={item.active} onEdit={() => onEdit(item)} onToggle={() => onToggle(item)} onDelete={() => onDelete(item)} /></td></tr>)}</tbody></table>;
}

function ZonesTable({ loading, zones, busyKey, onEdit, onToggle, onDelete }: { loading: boolean; zones: ShippingZoneResponse[]; busyKey: string; onEdit: (item: ShippingZoneResponse) => void; onToggle: (item: ShippingZoneResponse) => void; onDelete: (item: ShippingZoneResponse) => void }) {
  return <table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr className="text-left text-xs font-bold uppercase tracking-wide text-gray-500"><th className="px-5 py-3">Khu vực</th><th className="px-5 py-3">Tỉnh/thành</th><th className="px-5 py-3">Ưu tiên</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-gray-100">{loading ? <EmptyRow colSpan={5} text="Đang tải khu vực..." /> : zones.length === 0 ? <EmptyRow colSpan={5} text="Chưa có khu vực." /> : zones.map((item) => <tr key={item.id} className="align-top hover:bg-gray-50"><td className="px-5 py-4 font-bold text-gray-900">{item.name}</td><td className="px-5 py-4"><div className="flex max-w-xl flex-wrap gap-1.5">{item.provinces.map((province) => <span key={province} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{province}</span>)}</div></td><td className="px-5 py-4 text-sm font-bold text-gray-700">{item.priority}</td><td className="px-5 py-4"><Status active={item.active} /></td><td className="px-5 py-4"><RowActions busy={busyKey.includes(String(item.id))} active={item.active} onEdit={() => onEdit(item)} onToggle={() => onToggle(item)} onDelete={() => onDelete(item)} /></td></tr>)}</tbody></table>;
}

function MethodsTable({ loading, methods, busyKey, onEdit, onToggle, onDelete }: { loading: boolean; methods: ShippingMethodResponse[]; busyKey: string; onEdit: (item: ShippingMethodResponse) => void; onToggle: (item: ShippingMethodResponse) => void; onDelete: (item: ShippingMethodResponse) => void }) {
  return <table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr className="text-left text-xs font-bold uppercase tracking-wide text-gray-500"><th className="px-5 py-3">Mã</th><th className="px-5 py-3">Tên hiển thị</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-gray-100">{loading ? <EmptyRow colSpan={4} text="Đang tải phương thức..." /> : methods.length === 0 ? <EmptyRow colSpan={4} text="Chưa có phương thức." /> : methods.map((item) => <tr key={item.id} className="hover:bg-gray-50"><td className="px-5 py-4 font-extrabold text-gray-900">{item.code}</td><td className="px-5 py-4 text-sm font-semibold text-gray-700">{item.name}</td><td className="px-5 py-4"><Status active={item.active} /></td><td className="px-5 py-4"><RowActions busy={busyKey.includes(String(item.id))} active={item.active} onEdit={() => onEdit(item)} onToggle={() => onToggle(item)} onDelete={() => onDelete(item)} /></td></tr>)}</tbody></table>;
}

function RowActions({ active, busy, onEdit, onToggle, onDelete }: { active: boolean; busy: boolean; onEdit: () => void; onToggle: () => void; onDelete: () => void }) { return <div className="flex justify-end gap-2"><button type="button" onClick={onEdit} className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50">Sửa</button><button type="button" disabled={busy} onClick={onToggle} className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50">{active ? "Ngưng" : "Bật"}</button><button type="button" disabled={busy} onClick={onDelete} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50">Xóa</button></div>; }
function Status({ active }: { active: boolean }) { return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>{active ? "Đang hoạt động" : "Tạm ngưng"}</span>; }
function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) { return <tr><td colSpan={colSpan} className="px-5 py-12 text-center text-sm text-gray-500">{text}</td></tr>; }
function Stat({ label, value, total }: { label: string; value: number; total: number }) { return <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</p><p className="mt-2 text-2xl font-extrabold text-gray-900">{value}<span className="text-sm font-semibold text-gray-400"> / {total}</span></p></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1.5 block text-sm font-bold text-gray-700">{label}</span>{children}</label>; }
function ActiveCheckbox({ checked, onChange }: { checked: boolean; onChange: (active: boolean) => void }) { return <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /> Kích hoạt ngay</label>; }
function ModalActions({ busy, onCancel }: { busy: boolean; onCancel: () => void }) { return <div className="flex justify-end gap-3 border-t border-gray-200 pt-4"><button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700">Hủy</button><button disabled={busy} className="rounded-lg bg-[#EE4D2D] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{busy ? "Đang lưu..." : "Lưu cấu hình"}</button></div>; }
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onMouseDown={onClose}><div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}><div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4"><h2 className="font-extrabold text-gray-900">{title}</h2><button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-xl text-gray-500 hover:bg-gray-100">×</button></div><div className="p-5">{children}</div></div></div>; }
