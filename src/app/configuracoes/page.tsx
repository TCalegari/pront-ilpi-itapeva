"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Aviso } from "@/components/campos";
import { INSTITUICAO } from "@/config/instituicao";
import { reiniciarDemonstracao, useBanco } from "@/store/banco";

export default function ConfiguracoesPage() {
  const banco = useBanco()!;
  const [confirmar, setConfirmar] = useState(false);
  const graus = ["I", "II", "III"] as const;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Parâmetros da instituição</h1>
      <Aviso tipo="alerta">
        Valores provisórios. Os intervalos dos graus I e II e das escalas precisam ser confirmados com o impresso de SAE usado hoje. Altere em{" "}
        <code>src/config/instituicao.ts</code>.
      </Aviso>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Grau (RDC 502)</th>
              <th className="p-3">Revisão da SAE</th>
              <th className="p-3">Reaplicar Morse/Braden</th>
            </tr>
          </thead>
          <tbody>
            {graus.map((g) => (
              <tr key={g} className="border-t">
                <td className="p-3 font-medium">Grau {g}</td>
                <td className="p-3">{INSTITUICAO.revisaoSaeDias[g] === 1 ? "diária" : `a cada ${INSTITUICAO.revisaoSaeDias[g]} dias`}</td>
                <td className="p-3">a cada {INSTITUICAO.reavaliacaoEscalasDias[g]} dias + após queda, internação ou piora</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm">
        Plantões: diurno {INSTITUICAO.turnos.DIURNO.inicio}–{INSTITUICAO.turnos.DIURNO.fim}, noturno {INSTITUICAO.turnos.NOTURNO.inicio}–{INSTITUICAO.turnos.NOTURNO.fim}. Tolerância
        para atraso: {INSTITUICAO.toleranciaAtrasoMin} min.
      </p>

      <section className="flex flex-col gap-2 rounded-xl border p-4">
        <h2 className="font-semibold">Dados de demonstração</h2>
        <p className="text-sm text-muted-foreground">
          {banco.residentes.length} residentes, {banco.checagens.length} checagens e {banco.auditoria.length} eventos de auditoria neste navegador.
        </p>
        {!confirmar ? (
          <Button variant="outline" className="h-11 self-start" onClick={() => setConfirmar(true)}>
            <RotateCcw /> Restaurar dados de demonstração
          </Button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm">Apagar tudo o que foi registrado neste navegador?</span>
            <Button
              variant="destructive"
              className="h-11"
              onClick={() => {
                reiniciarDemonstracao();
                setConfirmar(false);
              }}
            >
              Sim, restaurar
            </Button>
            <Button variant="outline" className="h-11" onClick={() => setConfirmar(false)}>
              Cancelar
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
