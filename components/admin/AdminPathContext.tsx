"use client";

import React, { createContext, useContext } from "react";

interface AdminPathContextValue {
  basePath: string; // e.g. "/adm-9f82c417b03e"
}

const AdminPathContext = createContext<AdminPathContextValue>({
  basePath: "",
});

export function AdminPathProvider({
  basePath,
  children,
}: {
  basePath: string;
  children: React.ReactNode;
}) {
  return (
    <AdminPathContext.Provider value={{ basePath }}>
      {children}
    </AdminPathContext.Provider>
  );
}

export function useAdminPath() {
  const ctx = useContext(AdminPathContext);
  return {
    basePath: ctx.basePath,
    path: (subpath: string = "") => {
      if (!subpath || subpath === "/") return ctx.basePath || "";
      const cleanSub = subpath.startsWith("/") ? subpath : `/${subpath}`;
      return `${ctx.basePath}${cleanSub}`;
    },
  };
}
