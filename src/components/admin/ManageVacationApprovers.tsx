"use client";

import React, { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCollaborators } from "@/contexts/CollaboratorsContext";
import { useVacationApprovers } from "@/contexts/VacationApproversContext";
import { toast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, ChevronUp, Loader2, ShieldCheck } from "lucide-react";

const NO_RESPONSIBLE = "__none__";
type ApproverSortKey = "name" | "area" | "position" | "responsibleName";

export default function ManageVacationApprovers() {
  const { isSuperAdmin } = useAuth();
  const { collaborators } = useCollaborators();
  const {
    approvers,
    loading,
    resolvedResponsibles,
    setResponsible,
    removeResponsible,
  } = useVacationApprovers();
  const [savingUid, setSavingUid] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<ApproverSortKey>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const collaboratorsWithVacationAccess = useMemo(() => {
    return collaborators
      .filter((c) => c.permissions?.canManageVacation || false)
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [collaborators]);

  const approverMap = useMemo(() => {
    const map = new Map<string, { responsibleUid: string; responsibleName: string }>();
    approvers.forEach((a) =>
      map.set(a.userUid, {
        responsibleUid: a.responsibleUid,
        responsibleName: a.responsibleName,
      })
    );
    return map;
  }, [approvers]);

  const displayedCollaborators = useMemo(() => {
    const data = [...collaboratorsWithVacationAccess];
    return data.sort((a, b) => {
      const aUid = a.authUid ?? "";
      const bUid = b.authUid ?? "";
      const aResponsible = approverMap.get(aUid)?.responsibleName || "Sem responsável";
      const bResponsible = approverMap.get(bUid)?.responsibleName || "Sem responsável";

      let comparison = 0;
      if (sortKey === "name") {
        comparison = a.name.localeCompare(b.name, "pt-BR");
      } else if (sortKey === "area") {
        comparison = (a.area || "").localeCompare(b.area || "", "pt-BR");
      } else if (sortKey === "position") {
        comparison = (a.position || "").localeCompare(b.position || "", "pt-BR");
      } else if (sortKey === "responsibleName") {
        comparison = aResponsible.localeCompare(bResponsible, "pt-BR");
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [collaboratorsWithVacationAccess, approverMap, sortKey, sortDirection]);

  const handleSort = (key: ApproverSortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const SortableHeader = ({
    tkey,
    label,
  }: {
    tkey: ApproverSortKey;
    label: string;
  }) => (
    <TableHead onClick={() => handleSort(tkey)} className="cursor-pointer hover:bg-muted/50">
      <div className="flex items-center gap-1">
        {label}
        {sortKey === tkey &&
          (sortDirection === "asc" ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          ))}
      </div>
    </TableHead>
  );

  const handleChange = async (
    collabUid: string,
    collabName: string,
    selectedValue: string
  ) => {
    setSavingUid(collabUid);
    try {
      if (selectedValue === NO_RESPONSIBLE) {
        await removeResponsible(collabUid);
        toast({ title: "Responsável removido", description: `${collabName} não tem mais um responsável atribuído.` });
      } else {
        const responsible = resolvedResponsibles.find(
          (r) => r.authUid === selectedValue
        );
        if (!responsible) {
          throw new Error("Responsável não encontrado na base.");
        }
        await setResponsible(
          collabUid,
          collabName,
          responsible.authUid,
          responsible.name
        );
        toast({
          title: "Responsável atribuído",
          description: `${responsible.name} agora é responsável por ${collabName}.`,
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao alterar responsável",
        description:
          error instanceof Error ? error.message : "Falha inesperada.",
        variant: "destructive",
      });
    } finally {
      setSavingUid(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-l-4 border-l-blue-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Gestão de Responsáveis de Férias
          </CardTitle>
          <CardDescription>
            Defina o responsável por aprovar as solicitações de férias de cada colaborador.
            Apenas colaboradores com acesso à tela de férias são exibidos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader tkey="name" label="Colaborador" />
                  <SortableHeader tkey="area" label="Área" />
                  <SortableHeader tkey="position" label="Cargo" />
                  <SortableHeader tkey="responsibleName" label="Responsável" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedCollaborators.map((collab) => {
                  const uid = collab.authUid ?? "";
                  const current = approverMap.get(uid);
                  const isSaving = savingUid === uid;

                  return (
                    <TableRow key={collab.id}>
                      <TableCell className="font-medium">
                        {collab.name}
                      </TableCell>
                      <TableCell>{collab.area}</TableCell>
                      <TableCell>{collab.position}</TableCell>
                      <TableCell>
                        {uid ? (
                          <div className="flex items-center gap-2">
                            {isSaving && (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            <Select
                              value={current?.responsibleUid || NO_RESPONSIBLE}
                              disabled={!isSuperAdmin || isSaving}
                              onValueChange={(value) =>
                                handleChange(uid, collab.name, value)
                              }
                            >
                              <SelectTrigger className="w-[280px]">
                                <SelectValue placeholder="Selecionar responsável" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={NO_RESPONSIBLE}>
                                  Sem responsável
                                </SelectItem>
                                {resolvedResponsibles.map((r) => (
                                  <SelectItem key={r.authUid} value={r.authUid}>
                                    {r.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Sem login
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {displayedCollaborators.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      Nenhum colaborador com acesso à tela de férias.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
