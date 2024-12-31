export interface CartRequest {
  id: number;
  maKh: string;
  maHh: number;
  tenHH: string;
  hinh: string;
  donGia: number;
  tenNCC: string;
  quantity: number;
  total: number;
}
export interface CartReport {
  maKh: string;
  maHh: number;
  quantity: number;
  ngay: string;
}
export interface CouponRequest {
  Name: string;
  price: number;
  status: number;
  DateEnd: string;
}
