"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Crown, Sparkles, User } from "lucide-react";

export function PremiumsView() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const users = [
    { id: 1, name: "Bharat", email: "bharat@example.com", plan: "Gold" },
    { id: 2, name: "Rahul", email: "rahul@example.com", plan: "Diamond" },
  ];

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* HEADER CARD */}
      <Card className="bg-card border border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Crown className="size-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-foreground text-2xl">
                  Premiums Management
                </CardTitle>
                <p className="text-muted-foreground">
                  Manage premium users, subscriptions, and access.
                </p>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* SEARCH */}
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search premium users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-background text-foreground"
            />
          </div>

          {/* USER TABLE */}
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted text-foreground">
                <tr>
                  <th className="p-3 text-left flex items-center gap-2">
                    <User size={16} /> User
                  </th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Plan</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="p-6 text-center text-muted-foreground"
                    >
                      <Sparkles className="mx-auto mb-3 text-yellow-500" size={24} />
                      No premium users found
                    </td>
                  </tr>
                ) : (
                  filtered.map((user) => (
                    <tr
                      key={user.id}
                      className="border-t border-border hover:bg-muted/50"
                    >
                      <td className="p-3">{user.name}</td>
                      <td className="p-3">{user.email}</td>
                      <td className="p-3">{user.plan}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
