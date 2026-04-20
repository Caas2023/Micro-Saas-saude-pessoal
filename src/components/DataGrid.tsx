import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ExamMarker, SavedResult } from "../types/exam";
import { calculateClinicalStatus } from "../lib/calculations";
import { Save, AlertTriangle } from 'lucide-react';

interface DataGridProps {
  initialMarkers: ExamMarker[];
  onSave: (finalMarkers: SavedResult[]) => void;
  isSaving: boolean;
}

export const DataGrid: React.FC<DataGridProps> = ({ initialMarkers, onSave, isSaving }) => {
  const [markers, setMarkers] = useState<ExamMarker[]>(initialMarkers);

  const handleUpdate = (index: number, field: keyof ExamMarker, value: string) => {
    const newMarkers = [...markers];
    const numValue = value === "" ? null : parseFloat(value);
    
    if (field === "marker_name" || field === "unit") {
      newMarkers[index] = { ...newMarkers[index], [field]: value };
    } else {
      newMarkers[index] = { ...newMarkers[index], [field]: numValue };
    }
    setMarkers(newMarkers);
  };

  const handleSave = () => {
    const finalResults: SavedResult[] = markers.map(m => ({
      ...m,
      clinical_status: calculateClinicalStatus(m.value, m.reference_min, m.reference_max)
    }));
    onSave(finalResults);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          Revisão de Dados <Badge variant="outline">IA Extraída</Badge>
        </h2>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? "Salvando..." : <><Save className="w-4 h-4" /> Salvar Exame</>}
        </Button>
      </div>

      <div className="rounded-md border border-white/10 glass overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow>
              <TableHead>Marcador</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Ref. Min</TableHead>
              <TableHead>Ref. Max</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {markers.map((marker, index) => {
              const status = calculateClinicalStatus(marker.value, marker.reference_min, marker.reference_max);
              return (
                <TableRow key={index} className="hover:bg-white/5 transition-colors">
                  <TableCell>
                    <Input 
                      value={marker.marker_name} 
                      onChange={(e) => handleUpdate(index, "marker_name", e.target.value)}
                      className="bg-transparent border-none focus-visible:ring-1"
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number"
                      value={marker.value || ""} 
                      onChange={(e) => handleUpdate(index, "value", e.target.value)}
                      className="bg-transparent border-none focus-visible:ring-1 font-mono"
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      value={marker.unit} 
                      onChange={(e) => handleUpdate(index, "unit", e.target.value)}
                      className="bg-transparent border-none focus-visible:ring-1 opacity-70 text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number"
                      value={marker.reference_min ?? ""} 
                      onChange={(e) => handleUpdate(index, "reference_min", e.target.value)}
                      className="bg-transparent border-none focus-visible:ring-1 font-mono opacity-70"
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number"
                      value={marker.reference_max ?? ""} 
                      onChange={(e) => handleUpdate(index, "reference_max", e.target.value)}
                      className="bg-transparent border-none focus-visible:ring-1 font-mono opacity-70"
                    />
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={status === 'NORMAL' ? 'secondary' : 'destructive'}
                      className={status === 'NORMAL' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}
                    >
                      {status}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      
      <p className="text-sm text-muted-foreground flex items-center gap-2 italic">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        Confirme os dados acima com a imagem do exame ao lado para garantir precisão clínica de 100%.
      </p>
    </div>
  );
};
