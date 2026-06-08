"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, MapPin, User, Building, Phone, Mail, Send, Loader2 } from "lucide-react";

type EventSettings = {
  EventName: string;
  EventIntro: string;
  EventSchedule: string;
  OpenTimeKST: string;
  CloseTimeKST: string;
  MaxCapacity?: string;
  CurrentCount?: number;
};

export default function Home() {
  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"loading" | "before" | "active" | "after" | "full">("loading");

  const [formData, setFormData] = useState({ media: "", name: "", phone: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/event");
        const json = await res.json();
        if (json.success && json.data) {
          setSettings(json.data);
          checkTimeStatus(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
    
    // Check time every minute just in case
    const interval = setInterval(() => {
      if (settings) checkTimeStatus(settings);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const checkTimeStatus = (data: EventSettings) => {
    const now = new Date();
    // Convert current local time to KST
    const currentUtc = now.getTime() + now.getTimezoneOffset() * 60000;
    const currentKst = new Date(currentUtc + 9 * 60 * 60 * 1000);

    const openTime = new Date(data.OpenTimeKST.replace(/-/g, "/")); // Safari compat
    const closeTime = new Date(data.CloseTimeKST.replace(/-/g, "/"));

    if (currentKst < openTime) {
      setStatus("before");
    } else if (currentKst > closeTime) {
      setStatus("after");
    } else if (data.MaxCapacity && data.CurrentCount !== undefined) {
      const max = parseInt(data.MaxCapacity, 10);
      if (!isNaN(max) && data.CurrentCount >= max) {
        setStatus("full");
      } else {
        setStatus("active");
      }
    } else {
      setStatus("active");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.media || !formData.name || !formData.phone || !formData.email) {
      alert("모든 정보를 입력해 주세요.");
      return;
    }

    if (!formData.email.includes("@")) {
      alert("올바른 이메일 형식을 입력해 주세요.");
      return;
    }

    const phoneRegex = /^010-\d{4}-\d{4}$/;
    if (!phoneRegex.test(formData.phone)) {
      alert("핸드폰 번호를 다시 확인해 주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success) {
        setSubmitted(true);
      } else if (json.error === "full") {
        alert("죄송합니다. 선착순 모집이 방금 마감되었습니다.");
        setStatus("full");
      } else {
        alert("신청 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
    } catch (err) {
      alert("신청 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-[#ea002c] animate-spin" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
        행사 정보를 불러올 수 없습니다.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-6 md:px-12 flex items-center">
        <img src="/skb-logo.png" alt="SK Broadband" className="h-8 object-contain" onError={(e) => {
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextElementSibling?.classList.remove('hidden');
        }}/>
        {/* Fallback if image not found */}
        <div className="hidden flex items-center gap-2">
          <div className="w-8 h-8 bg-[#ea002c] rounded-bl-xl rounded-tr-xl"></div>
          <span className="text-xl font-bold tracking-tighter text-gray-900">
            SK<span className="text-[#ea002c]">broadband</span>
          </span>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 grid md:grid-cols-2 gap-8 items-start mt-4 md:mt-12">
        {/* Left Column: Event Details */}
        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 md:p-12 border border-gray-100/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#ea002c] to-[#f96025]"></div>
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 leading-tight whitespace-pre-wrap break-keep flex items-center flex-wrap gap-2">
            <img src="/btv-logo.png" alt="B tv" className="h-10 object-contain inline-block -mt-1" onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}/>
            <span className="hidden text-[#ea002c] font-black">B tv</span>
            신규 서비스 기자 설명회
          </h1>
          
          <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-10 whitespace-pre-wrap break-keep">
            {settings.EventIntro}
          </p>

          <div className="space-y-6">
            {settings.EventSchedule.split('\n').reduce((acc, line) => {
              if (line.match(/^(일시|장소|주관|안내)\s*:/)) {
                acc.push([line]);
              } else if (acc.length > 0) {
                acc[acc.length - 1].push(line);
              }
              return acc;
            }, [] as string[][]).map((lines, i) => {
              const firstLine = lines[0];
              const isDate = firstLine.includes('일시');
              const isLocation = firstLine.includes('장소');
              const isHost = firstLine.includes('주관');
              
              const titleMatch = firstLine.match(/^(일시|장소|주관|안내)\s*:\s*/);
              const title = titleMatch ? titleMatch[1] : '안내';
              const contentFirstLine = firstLine.replace(/^(일시|장소|주관|안내)\s*:\s*/, '');
              
              let content = <p className="text-gray-900 font-medium text-base md:text-lg break-keep">{contentFirstLine}</p>;
              
              if (isLocation) {
                const parts = contentFirstLine.split('(');
                if (parts.length > 1) {
                  content = (
                    <>
                      <p className="text-gray-900 font-medium text-base md:text-lg break-keep">{parts[0].trim()}</p>
                      <p className="text-gray-500 text-sm md:text-base mt-1 break-keep">({parts.slice(1).join('(').replace(/-/g, '\u2011')}</p>
                    </>
                  );
                }
              }

              return (
                <div key={i} className="flex items-start gap-4">
                  <div className="mt-1 p-3 bg-red-50 rounded-2xl text-[#ea002c]">
                    {isDate ? <Calendar className="w-6 h-6" /> : isLocation ? <MapPin className="w-6 h-6" /> : isHost ? <Building className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-1">{title}</h3>
                    {content}
                    {lines.slice(1).map((line, j) => (
                      <p key={j} className={`text-gray-900 ${isHost ? 'font-medium text-base md:text-lg' : 'text-gray-500 text-sm md:text-base'} mt-1 break-keep`}>{line}</p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Registration Form */}
        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 md:p-12 border border-gray-100/50">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">참가 신청</h2>
            <p className="text-gray-500">아래 정보를 입력하여 참가를 신청해 주세요.</p>
          </div>

          {status === "before" && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">신청 대기 중</h3>
              <p className="text-gray-500 mb-2 break-keep">아직 신청 기간이 아닙니다.</p>
              <p className="text-sm font-medium text-[#ea002c] bg-red-50 inline-block px-4 py-2 rounded-full mt-2">
                오픈: {settings.OpenTimeKST}
              </p>
            </div>
          )}

          {status === "after" && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">신청 마감</h3>
              <p className="text-gray-500 break-keep">참가 신청 기한이 지났습니다.<br/>관심 가져주셔서 감사합니다.</p>
            </div>
          )}

          {status === "full" && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">정원 초과 마감</h3>
              <p className="text-gray-500 break-keep">
                신청 가능 인원이 초과되어 접수가 마감되었습니다.<br/>
                추가 문의는 SK브로드밴드 PR실로 부탁드립니다.
              </p>
            </div>
          )}

          {status === "active" && submitted && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">신청 완료</h3>
              <p className="text-green-700">참가 신청이 성공적으로 접수되었습니다.</p>
            </div>
          )}

          {status === "active" && !submitted && (
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 ml-1">매체명</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Building className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.media}
                    onChange={(e) => setFormData({ ...formData, media: e.target.value })}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ea002c]/20 focus:border-[#ea002c] transition-all"
                    placeholder="소속 매체명을 입력하세요"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 ml-1">기자명</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ea002c]/20 focus:border-[#ea002c] transition-all"
                    placeholder="성함을 입력하세요"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 ml-1">핸드폰 번호</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Phone className="w-5 h-5" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^0-9]/g, "");
                      if (val.length > 3 && val.length <= 7) {
                        val = val.replace(/(\d{3})(\d+)/, "$1-$2");
                      } else if (val.length > 7) {
                        val = val.replace(/(\d{3})(\d{4})(\d+)/, "$1-$2-$3");
                      }
                      if (val.length > 13) val = val.substring(0, 13);
                      setFormData({ ...formData, phone: val });
                    }}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ea002c]/20 focus:border-[#ea002c] transition-all"
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">이메일</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#ea002c]/20 focus:border-[#ea002c] transition-colors text-gray-900"
                    placeholder="example@sk.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 px-6 bg-gradient-to-r from-[#ea002c] to-[#f96025] hover:opacity-90 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    처리 중...
                  </>
                ) : (
                  <>
                    신청하기
                    <Send className="w-5 h-5 ml-1" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </main>

      <footer className="mt-auto py-8 text-center text-gray-400 text-sm">
        <p>COPYRIGHT © SK BROADBAND CO., LTD. ALL RIGHTS RESERVED.</p>
      </footer>
    </div>
  );
}
