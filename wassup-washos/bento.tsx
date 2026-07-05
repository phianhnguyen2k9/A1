              <div className="grid grid-cols-12 gap-6">
                
                {/* 1. Traffic Heatmap by Hour */}
                <div className="col-span-12 lg:col-span-8 bg-white/5 border border-white/10 rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-white/50">Mật độ phương tiện vào trạm (24h Traffic)</h4>
                      <p className="text-[10px] text-white/40 mt-0.5">Giờ cao điểm ghi nhận nhiều nhất từ 9 AM - 4 PM</p>
                    </div>
                    <span className="text-[10px] font-mono text-[#F27D26] bg-[#F27D26]/10 px-2 py-0.5 rounded">Real-time Sensor Feed</span>
                  </div>

                  {/* SVG Heatmap graph */}
                  <div className="flex items-end gap-2.5 h-36 border-b border-white/10 pb-2">
                    {[
                      { hour: '8 AM', h: 30, cars: 4 },
                      { hour: '9 AM', h: 65, cars: 9 },
                      { hour: '10 AM', h: 85, cars: 12 },
                      { hour: '11 AM', h: 70, cars: 10 },
                      { hour: '12 PM', h: 45, cars: 6 },
                      { hour: '1 PM', h: 50, cars: 7 },
                      { hour: '2 PM', h: 75, cars: 11 },
                      { hour: '3 PM', h: 95, cars: 14 },
                      { hour: '4 PM', h: 80, cars: 11 },
                      { hour: '5 PM', h: 55, cars: 8 },
                      { hour: '6 PM', h: 35, cars: 5 },
                      { hour: '7 PM', h: 20, cars: 2 }
                    ].map((item, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full mb-1 bg-[#F27D26] text-black text-[9px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all pointer-events-none font-mono">
                          {item.cars} xe
                        </div>
                        <div 
                          className="w-full bg-gradient-to-t from-[#F27D26]/60 to-[#F27D26] rounded-t hover:brightness-110 transition-all" 
                          style={{ height: `${item.h}px` }}
                        ></div>
                        <span className="text-[9px] font-mono text-white/30 uppercase mt-2 transform -rotate-12">{item.hour}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Service mix distribution */}
                <div className="col-span-12 lg:col-span-4 bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-6">Thống kê Gói Dịch Vụ sử dụng (Service Mix)</h4>
                  
                  <div className="space-y-4 text-xs">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span>W1/W2 - Rửa dọn cơ bản:</span>
                        <span className="font-mono font-bold text-white">45%</span>
                      </div>
                      <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                        <div className="bg-[#F27D26] h-full" style={{ width: '45%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span>W3/W4 - Chăm sóc nâng cao:</span>
                        <span className="font-mono font-bold text-white">32%</span>
                      </div>
                      <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                        <div className="bg-orange-400 h-full" style={{ width: '32%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span>W5 - Prime / Ceramic cao cấp:</span>
                        <span className="font-mono font-bold text-white">18%</span>
                      </div>
                      <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-400 h-full" style={{ width: '18%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Resource & Chemical Inventory */}
                <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                    <p className="text-[10px] uppercase text-white/40 font-bold mb-1">Dịch bọt tuyết mịn (Foam Active)</p>
                    <p className="text-xl font-bold font-mono text-white">{chemicals.foam}%</p>
                    <div className="h-1 bg-white/10 mt-2 rounded-full overflow-hidden">
                      <div className="bg-orange-500 h-full" style={{ width: `${chemicals.foam}%` }}></div>
                    </div>
                  </div>
                  <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                    <p className="text-[10px] uppercase text-white/40 font-bold mb-1">Dịch Wax bóng mượt (Wax Gloss)</p>
                    <p className="text-xl font-bold font-mono text-white">{chemicals.wax}%</p>
                    <div className="h-1 bg-white/10 mt-2 rounded-full overflow-hidden">
                      <div className="bg-yellow-400 h-full" style={{ width: `${chemicals.wax}%` }}></div>
                    </div>
                  </div>
                  <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                    <p className="text-[10px] uppercase text-white/40 font-bold mb-1">Nước RO súc lọc béc (Water Tank)</p>
                    <p className="text-xl font-bold font-mono text-red-500">{chemicals.water}%</p>
                    <div className="h-1 bg-white/10 mt-2 rounded-full overflow-hidden">
                      <div className="bg-red-500 h-full" style={{ width: `${chemicals.water}%` }}></div>
                    </div>
                  </div>
                  <div className="bg-[#A2C62C]/10 p-4 rounded-xl border border-[#A2C62C]/30 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] uppercase text-[#A2C62C] font-bold">BẢO TRÌ BƠM ÁP LỰC</p>
                      <p className="text-xs text-white/70 mt-1">Chu kỳ bơm: 4,500/5,000h</p>
                    </div>
                    <span className="text-[9px] bg-green-500 text-black px-2 py-0.5 rounded font-bold text-center self-start">AN TOÀN</span>
                  </div>
                </div>

              </div>
            </div>
