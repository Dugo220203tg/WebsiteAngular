export interface ProductRequest {
  maHH: number;
  tenHH: string;
  hinh: string;
  giamGia: number;
  donGia: number;
  trungBinhSao: number;
  soLuongDanhGia: number;
  soLuong: number;
}
export interface ProductDetailRequest {
  maHH: number;
  tenHH: string;
  hinh: string;
  moTa: string;
  moTaDonVi: string;
  maLoai: number;
  ngaySX: string;
  maNCC: string;
  giamGia: number;
  donGia: number;
  soLanXem: number;
  soLuong: number;
  tenNCC: string;
  tenLoai: string;
  tenDanhMuc: string;
  maDanhMuc: number;
  trungBinhSao: number;
  soLuongDanhGia: number;
  danhGiaSpMDs: DanhGia[];
}

interface DanhGia {
  maDg: number;
  maKH: string;
  noiDung: string;
  sao: number;
  ngay: string;
  maHH: number;
  trangThai: number;
}
