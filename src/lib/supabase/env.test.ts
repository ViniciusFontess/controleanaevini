import assert from "node:assert/strict";
import test from "node:test";
import { clean, normalizeUrl } from "./env.ts";

const CANONICAL = "https://iotjvhvcanebowhdvxva.supabase.co";

test("normalizeUrl aceita a URL canônica inalterada", () => {
  assert.equal(normalizeUrl(CANONICAL), CANONICAL);
});

test("normalizeUrl tolera os erros de colagem em painel", () => {
  // espaço/quebra de linha nas pontas
  assert.equal(normalizeUrl(`  ${CANONICAL}  `), CANONICAL);
  assert.equal(normalizeUrl(`${CANONICAL}\n`), CANONICAL);
  // aspas em volta
  assert.equal(normalizeUrl(`"${CANONICAL}"`), CANONICAL);
  assert.equal(normalizeUrl(`'${CANONICAL}'`), CANONICAL);
  // sem protocolo
  assert.equal(normalizeUrl("iotjvhvcanebowhdvxva.supabase.co"), CANONICAL);
  // barra ou caminho no fim
  assert.equal(normalizeUrl(`${CANONICAL}/`), CANONICAL);
  assert.equal(normalizeUrl(`${CANONICAL}/rest/v1`), CANONICAL);
});

test("normalizeUrl rejeita o que não dá para salvar", () => {
  assert.equal(normalizeUrl(undefined), undefined);
  assert.equal(normalizeUrl(""), undefined);
  assert.equal(normalizeUrl("   "), undefined);
  assert.equal(normalizeUrl("postgres://user:pw@host:5432/db"), undefined);
});

test("clean tira espaços e aspas da chave, preservando o conteúdo", () => {
  assert.equal(clean("  sb_publishable_abc  "), "sb_publishable_abc");
  assert.equal(clean('"sb_publishable_abc"'), "sb_publishable_abc");
  assert.equal(clean("sb_publishable_abc\n"), "sb_publishable_abc");
  assert.equal(clean(""), undefined);
  assert.equal(clean(undefined), undefined);
});

test("clean não mexe em aspas internas da chave", () => {
  assert.equal(clean('sb_publishable_a"b'), 'sb_publishable_a"b');
});
