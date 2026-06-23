import React from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Edit, Trash2, CheckCircle, XCircle, Power } from "lucide-react";

export default function HolidaysTab({ holidays, globalSettings, onAddHoliday, onEditHoliday }) {
  const queryClient = useQueryClient();
  const isHolidayDisplayOn = globalSettings.find(s => s.setting_key === 'holiday_display_enabled')?.setting_value === 'true';
  const activeHoliday = holidays.find(h => h.is_active === true);

  const toggleHolidayMode = async () => {
    const existing = globalSettings.find(s => s.setting_key === 'holiday_display_enabled');
    const newValue = !isHolidayDisplayOn;
    if (existing) {
      await base44.entities.GlobalSettings.update(existing.id, { setting_value: newValue ? 'true' : 'false' });
    } else {
      await base44.entities.GlobalSettings.create({ setting_key: 'holiday_display_enabled', setting_value: newValue ? 'true' : 'false', description: 'Show/hide holiday notice to users' });
    }
    queryClient.invalidateQueries({ queryKey: ['global-settings'] });
    alert(newValue ? '🔴 Holiday mode activated — users will see the holiday notice' : '✅ Holiday mode deactivated — platform running normal');
  };

  const sortedHolidays = [...holidays].sort((a, b) => {
    // Active first, then by date
    if (a.is_active && !b.is_active) return -1;
    if (!a.is_active && b.is_active) return 1;
    return a.holiday_date.localeCompare(b.holiday_date);
  });

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-xl">Holiday Management</h2>
                <p className="text-purple-200 text-sm">{holidays.length} holidays configured</p>
              </div>
            </div>
            <Button onClick={onAddHoliday} className="bg-white text-purple-700 hover:bg-purple-50 font-semibold">
              <Plus className="w-4 h-4 mr-2" />Add Holiday
            </Button>
          </div>

          {/* Holiday Mode Toggle */}
          <div className={`rounded-2xl p-5 border-2 transition-all ${isHolidayDisplayOn ? 'bg-red-100 border-red-400' : 'bg-green-100 border-green-400'}`}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isHolidayDisplayOn ? 'bg-red-500' : 'bg-green-500'}`}>
                  <Power className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className={`font-bold text-lg ${isHolidayDisplayOn ? 'text-red-800' : 'text-green-800'}`}>
                    {isHolidayDisplayOn ? '🔴 Holiday Mode ACTIVE' : '✅ Platform Running Normally'}
                  </p>
                  <p className={`text-sm ${isHolidayDisplayOn ? 'text-red-700' : 'text-green-700'}`}>
                    {isHolidayDisplayOn
                      ? activeHoliday ? `Showing: ${activeHoliday.emoji || '🎉'} ${activeHoliday.holiday_name}` : 'Holiday notice visible to users'
                      : 'Holiday notices are hidden from users'}
                  </p>
                </div>
              </div>
              <Button
                size="lg"
                className={`font-bold px-6 py-3 min-w-[180px] ${isHolidayDisplayOn ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                onClick={toggleHolidayMode}
              >
                {isHolidayDisplayOn ? '✅ Turn OFF Holiday Mode' : '🔴 Turn ON Holiday Mode'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Holidays List */}
      <div>
        <h3 className="text-gray-700 font-bold text-lg mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-600" />
          All Holidays ({holidays.length})
        </h3>

        {sortedHolidays.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedHolidays.map(holiday => {
              const isPast = holiday.holiday_date < new Date().toISOString().split('T')[0];
              return (
                <Card
                  key={holiday.id}
                  className={`overflow-hidden border-2 transition-all hover:shadow-md ${
                    holiday.is_active
                      ? 'border-green-400 shadow-green-100 shadow-md'
                      : isPast
                      ? 'border-gray-200 opacity-70'
                      : 'border-purple-200'
                  }`}
                >
                  {/* Card accent bar */}
                  <div className={`h-1.5 ${holiday.is_active ? 'bg-gradient-to-r from-green-400 to-emerald-500' : isPast ? 'bg-gray-300' : 'bg-gradient-to-r from-purple-400 to-pink-400'}`} />

                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      {/* Left: emoji + info */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                          holiday.is_active ? 'bg-green-100' : isPast ? 'bg-gray-100' : 'bg-purple-100'
                        }`}>
                          {holiday.emoji || '🎉'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-gray-900 text-base">{holiday.holiday_name}</p>
                            {holiday.is_active && (
                              <Badge className="bg-green-500 text-white text-xs">● Active</Badge>
                            )}
                            {isPast && !holiday.is_active && (
                              <Badge variant="secondary" className="text-xs">Past</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <p className="text-sm font-medium text-gray-600">
                              {new Date(holiday.holiday_date + 'T00:00:00').toLocaleDateString('en-IN', {
                                weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
                              })}
                            </p>
                          </div>
                          {holiday.message && (
                            <div className="mt-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                              <p className="text-xs text-gray-600 italic">"{holiday.message}"</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: actions */}
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <Button
                          size="sm"
                          variant={holiday.is_active ? 'default' : 'outline'}
                          className={`h-8 text-xs ${holiday.is_active ? 'bg-green-600 hover:bg-green-700' : 'border-purple-300 text-purple-700 hover:bg-purple-50'}`}
                          onClick={async () => {
                            await base44.entities.Holiday.update(holiday.id, { is_active: !holiday.is_active });
                            queryClient.invalidateQueries({ queryKey: ['holidays'] });
                          }}
                        >
                          {holiday.is_active ? <><CheckCircle className="w-3 h-3 mr-1" />On</> : <><XCircle className="w-3 h-3 mr-1" />Off</>}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => onEditHoliday(holiday)}
                        >
                          <Edit className="w-3 h-3 mr-1" />Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 text-xs"
                          onClick={async () => {
                            if (confirm(`Delete "${holiday.holiday_name}"?`)) {
                              await base44.entities.Holiday.delete(holiday.id);
                              queryClient.invalidateQueries({ queryKey: ['holidays'] });
                            }
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed border-2 border-gray-200">
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-semibold text-lg">No holidays added yet</p>
              <p className="text-gray-400 text-sm mb-5">Add holidays to notify users about upcoming platform closures</p>
              <Button onClick={onAddHoliday} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />Add First Holiday
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
