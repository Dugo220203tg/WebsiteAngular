export interface CheckoutModel {
    fullName: string;
    orderInfo: string;
    amount: number;
    payMethod: string;
    couponCode: string;
    maKh: string;
    diaChi: string;
    cachThanhToan: string;
    cachVanChuyen: string;
    shippingFee: number;
    ghiChu: string;
    dienThoai: string;
    chiTietHoaDons: ChiTietHoaDon[];
  }
  
  export interface ChiTietHoaDon {
    maHh: number;
    soLuong: number;
    donGia: number;
    maGiamGia: number;
  }
  
  export interface PayHistory {
    id: number;
    fullName: string;
    orderInfo: string;
    amount: number;
    payMethod: string;
    couponCode?: string;
    createDate: string;
  }
  