const { hasilkanMuatanQR, verifikasiMuatanQR } = require('../src/utils/crypto');
beforeAll(() => {
    process.env.HMAC_SECRET = 'test_secret_for_jest';
    process.env.QR_EXPIRY_SEC = '90';
});
describe('Utilitas Kripto QR', () => {
    it('Harus berhasil menghasilkan dan memverifikasi muatan yang valid', () => {
        const id_sesi = 123;
        const nonce = 'abcd1234efgh5678';
        const string_muatan = hasilkanMuatanQR(id_sesi, nonce);
        const hasil = verifikasiMuatanQR(string_muatan);
        expect(hasil.valid).toBe(true);
        expect(hasil.id_sesi).toBe(id_sesi);
        expect(hasil.nonce).toBe(nonce);
        expect(hasil.waktu_stempel).toBeGreaterThan(0);
    });
    it('Harus gagal memverifikasi untuk tanda tangan yang dimodifikasi', () => {
        const id_sesi = 123;
        const nonce = 'abcd1234efgh5678';
        const string_muatan = hasilkanMuatanQR(id_sesi, nonce);
        const didekode = JSON.parse(Buffer.from(string_muatan, 'base64').toString());
        didekode.s = didekode.s.substring(0, didekode.s.length - 1) + 'a';
        const string_dimodifikasi = Buffer.from(JSON.stringify(didekode)).toString('base64');
        const hasil = verifikasiMuatanQR(string_dimodifikasi);
        expect(hasil.valid).toBe(false);
        expect(hasil.error).toBe('Tanda tangan tidak valid');
    });
    it('Harus gagal memverifikasi untuk atribut muatan yang dimanipulasi', () => {
        const id_sesi = 123;
        const nonce = 'abcd1234efgh5678';
        const string_muatan = hasilkanMuatanQR(id_sesi, nonce);
        const didekode = JSON.parse(Buffer.from(string_muatan, 'base64').toString());
        didekode.p = didekode.p.replace('123', '999');
        const string_dimanipulasi = Buffer.from(JSON.stringify(didekode)).toString('base64');
        const hasil = verifikasiMuatanQR(string_dimanipulasi);
        expect(hasil.valid).toBe(false);
        expect(hasil.error).toBe('Tanda tangan tidak valid'); 
    });
    it('Harus mengembalikan false untuk string yang benar-benar tidak sesuai format', () => {
        const hasil = verifikasiMuatanQR('bukan_base_64_sama_sekali!@@#$');
        expect(hasil.valid).toBe(false);
        expect(hasil.error).toBe('Format muatan tidak valid');
    });
});
