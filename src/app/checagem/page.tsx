"use client";

import { useState } from "react";
import { Aviso, CampoTexto, Escolha } from "@/components/campos";
import { FolhaResidente, rotuloPlantao } from "@/components/folha-checagem";
import { plantaoDe, type Plantao } from "@/domain/aprazamento";
import { agoraLocal } from "@/domain/datas";
import { useBanco } from "@/store/banco";
import { residentesAtivos, planoVigente } from "@/store/consultas";

export default function ChecagemPage() {
  const banco = useBanco()!;
  const [plantao, setPlantao] = useState<Plantao>(() => plantaoDe(agoraLocal()));
  const residentes = residentesAtivos(banco);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Checagem do plantão</h1>
        <p className="text-sm text-muted-foreground">{rotuloPlantao(plantao)}</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <CampoTexto type="date" className="h-11 sm:w-48" valor={plantao.data} aoMudar={(data) => data && setPlantao((p) => ({ ...p, data }))} />
        <Escolha
          opcoes={[
            { valor: "DIURNO" as const, rotulo: "Diurno 07–19 h" },
            { valor: "NOTURNO" as const, rotulo: "Noturno 19–07 h" },
          ]}
          valor={plantao.turno}
          aoMudar={(turno) => setPlantao((p) => ({ ...p, turno }))}
        />
      </div>
      <Aviso tipo="info">
        Cada checagem fica registrada com autor e horário e não pode ser apagada. Para corrigir, use “Retificar” (gera um novo registro ligado ao original).
      </Aviso>
      <div className="flex flex-col gap-8">
        {residentes.map((r) => {
          const plano = planoVigente(banco, r.id);
          return plano ? <FolhaResidente key={r.id} banco={banco} residente={r} plano={plano} plantao={plantao} /> : null;
        })}
      </div>
    </div>
  );
}
