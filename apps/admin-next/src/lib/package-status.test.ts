import { describe, expect, it } from 'vitest';
import { nextPackageStatus, packageActionsFor } from './package-status';

describe('ES-paquete state machine', () => {
  it('receives only from Enviado', () => {
    expect(nextPackageStatus('Enviado', 'receive', 'logistical')).toEqual({ ok: true, to: 'Recibido' });
    expect(nextPackageStatus('Recibido', 'receive', 'logistical').ok).toBe(false);
  });

  it('finishes from Enviado or Recibido', () => {
    expect(nextPackageStatus('Recibido', 'finish', 'logistical')).toEqual({ ok: true, to: 'Procesado' });
    expect(nextPackageStatus('Enviado', 'finish', 'admin').ok).toBe(true);
    expect(nextPackageStatus('Procesado', 'finish', 'admin').ok).toBe(false);
  });

  it('reopens only for admin', () => {
    expect(nextPackageStatus('Procesado', 'reopen', 'admin')).toEqual({ ok: true, to: 'Recibido' });
    expect(nextPackageStatus('Procesado', 'reopen', 'logistical').ok).toBe(false);
  });

  it('rejects unknown statuses and roles', () => {
    expect(nextPackageStatus('Completado', 'finish', 'admin').ok).toBe(false);
    expect(nextPackageStatus('Recibido', 'finish', 'agent').ok).toBe(false);
  });

  it('lists explicit actions per role', () => {
    expect(packageActionsFor('Recibido', 'logistical').map((a) => a.action)).toEqual(['finish']);
    expect(packageActionsFor('Procesado', 'admin').map((a) => a.action)).toEqual(['reopen']);
    expect(packageActionsFor('Procesado', 'logistical')).toEqual([]);
  });
});
