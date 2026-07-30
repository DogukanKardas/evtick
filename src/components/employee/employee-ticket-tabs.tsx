"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TicketStatusActions } from "@/components/tickets/ticket-status-actions";
import { ChatPanel } from "@/components/chat/chat-panel";
import type {
  Profile,
  Ticket,
  TicketMessage,
  TicketStatusLog,
} from "@/types/database";

type Tab = "general" | "chat" | "history";

interface EmployeeTicketTabsProps {
  ticket: Ticket;
  profile: Profile;
  messages: TicketMessage[];
  statusLogs: TicketStatusLog[];
  initialTab?: Tab;
  onTabChange?: (tab: Tab) => void;
}

export function EmployeeTicketTabs({
  ticket,
  profile,
  messages,
  statusLogs,
  initialTab = "general",
  onTabChange,
}: EmployeeTicketTabsProps) {
  const [tab, setTab] = useState<Tab>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  function selectTab(id: Tab) {
    setTab(id);
    onTabChange?.(id);
  }

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "general", label: "Genel" },
    { id: "chat", label: "Mesajlar", badge: messages.length },
    { id: "history", label: "Geçmiş" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 border-b pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => selectTab(t.id)}
            className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm ${
              tab === t.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {t.label}
            {t.badge !== undefined && t.badge > 0 && (
              <span
                className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
                  tab === t.id
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Açıklama</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{ticket.description}</p>
            </CardContent>
          </Card>

          <div>
            <h2 className="mb-2 text-sm font-medium">Durum İşlemleri</h2>
            <TicketStatusActions ticket={ticket} profile={profile} />
          </div>
        </div>
      )}

      {tab === "chat" && (
        <div className="-mx-1 sm:mx-0">
          <ChatPanel
            ticketId={ticket.id}
            profileId={profile.id}
            initialMessages={messages}
            ticketStatus={ticket.status}
          />
        </div>
      )}

      {tab === "history" && (
        <>
          {statusLogs.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Durum geçmişi bulunmuyor.
            </p>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Durum Geçmişi</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {statusLogs.map((log) => (
                    <li
                      key={log.id}
                      className="flex justify-between text-muted-foreground"
                    >
                      <span>
                        {log.old_status ?? "—"} → {log.new_status}
                        {log.changer && ` (${log.changer.full_name})`}
                      </span>
                      <span>
                        {format(new Date(log.created_at), "d MMM HH:mm", {
                          locale: tr,
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
