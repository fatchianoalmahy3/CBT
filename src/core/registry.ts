import { ModuleSchema } from './types';

export const MODULE_REGISTRY: ModuleSchema[] = [
  {
    id: 'products',
    title: 'Manajemen Produk',
    description: 'Katalog barang dagang, penetapan harga, spesifikasi, dan status inventori.',
    icon: 'Package',
    allowedRoles: ['SUPER_ADMIN', 'SALES_REP'],
    fields: [
      {
        key: 'name',
        label: 'Nama Produk',
        type: 'text',
        placeholder: 'Contoh: Macbook Pro M3 Max',
        validation: { required: true, min: 3 }
      },
      {
        key: 'price',
        label: 'Harga (IDR)',
        type: 'number',
        placeholder: 'Contoh: 35000000',
        validation: { required: true, min: 0 },
        defaultValue: 0
      },
      {
        key: 'category',
        label: 'Kategori',
        type: 'select',
        options: ['Elektronik', 'Fashion', 'Makanan & Minuman', 'Otomotif', 'Furnitur'],
        validation: { required: true }
      },
      {
        key: 'description',
        label: 'Deskripsi Produk',
        type: 'richtext',
        placeholder: 'Tulis deskripsi produk secara lengkap...',
        validation: { required: true }
      },
      {
        key: 'image_url',
        label: 'Foto Produk',
        type: 'file',
        placeholder: 'Unggah foto produk (PNG/JPG)'
      }
    ]
  },
  {
    id: 'employees',
    title: 'Data Karyawan',
    description: 'Direktori staf internal, jabatan struktural, penugasan kantor cabang, dan berkas CV.',
    icon: 'Users',
    allowedRoles: ['SUPER_ADMIN', 'HR_MANAGER'],
    fields: [
      {
        key: 'name',
        label: 'Nama Lengkap',
        type: 'text',
        placeholder: 'Masukkan nama sesuai KTP',
        validation: { required: true }
      },
      {
        key: 'role_title',
        label: 'Jabatan',
        type: 'text',
        placeholder: 'Contoh: Senior Fullstack Engineer',
        validation: { required: true }
      },
      {
        key: 'department',
        label: 'Departemen',
        type: 'select',
        options: ['Teknologi', 'Sumber Daya Manusia', 'Pemasaran & Sales', 'Keuangan & Akuntansi'],
        validation: { required: true }
      },
      {
        key: 'cv_url',
        label: 'CV & Berkas Pendukung',
        type: 'file',
        placeholder: 'Unggah berkas CV format PDF'
      },
      {
        key: 'office_location',
        label: 'Lokasi Penugasan (Koordinat)',
        type: 'location',
        placeholder: 'Pilih lokasi di peta...'
      }
    ]
  },
  {
    id: 'orders',
    title: 'Pesanan & Transaksi',
    description: 'Pencatatan invoice pelanggan, status pembayaran, dan rekapitulasi penjualan.',
    icon: 'Receipt',
    allowedRoles: ['SUPER_ADMIN', 'SALES_REP', 'HR_MANAGER'],
    fields: [
      {
        key: 'customer_name',
        label: 'Nama Pelanggan',
        type: 'text',
        placeholder: 'Contoh: PT Surya Nusantara',
        validation: { required: true }
      },
      {
        key: 'invoice_number',
        label: 'Nomor Invoice',
        type: 'text',
        placeholder: 'INV-2026-001',
        validation: { required: true }
      },
      {
        key: 'total_amount',
        label: 'Total Tagihan (IDR)',
        type: 'number',
        placeholder: 'Contoh: 15000000',
        validation: { required: true, min: 0 }
      },
      {
        key: 'payment_status',
        label: 'Status Pembayaran',
        type: 'select',
        options: ['Lunas', 'Menunggu Pembayaran', 'Dibatalkan'],
        validation: { required: true }
      },
      {
        key: 'invoice_notes',
        label: 'Catatan & Rincian Invoice',
        type: 'richtext',
        placeholder: 'Rincian item pemesanan atau instruksi pembayaran...'
      }
    ]
  },
  {
    id: 'audit_logs',
    title: 'Log Audit Sistem',
    description: 'Rekam jejak aktivitas REST Gateway, modifikasi data, dan import massal.',
    icon: 'History',
    allowedRoles: ['SUPER_ADMIN', 'VIEWER'],
    fields: [
      {
        key: 'action',
        label: 'Aktivitas',
        type: 'text',
        validation: { required: true }
      },
      {
        key: 'user',
        label: 'Oleh Pengguna',
        type: 'text',
        validation: { required: true }
      },
      {
        key: 'timestamp',
        label: 'Waktu Kejadian',
        type: 'text',
        validation: { required: true }
      },
      {
        key: 'details',
        label: 'Detail Log',
        type: 'richtext'
      }
    ]
  }
];
