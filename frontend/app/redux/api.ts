import {
  createApi,
  fakeBaseQuery,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import authHttpService, {
  type LoginInput,
  type RegisterInput,
} from "~/services/authHttpService";
import brandHttpService from "~/services/brandHttpService";
import cartHttpService from "~/services/cartHttpService";
import categoryHttpService from "~/services/categoryHttpService";
import couponHttpService from "~/services/couponHttpService";
import dashboardHttpService from "~/services/dashboardHttpService";
import { ApiError } from "~/services/httpClient";
import orderHttpService, {
  type CreateOrderInput,
} from "~/services/orderHttpService";
import productHttpService from "~/services/productHttpService";
import reviewHttpService from "~/services/reviewHttpService";
import settingsHttpService from "~/services/settingsHttpService";
import uploadHttpService from "~/services/uploadHttpService";
import userHttpService from "~/services/userHttpService";
import wishlistHttpService from "~/services/wishlistHttpService";
import type {
  Address,
  AdminCustomerDetail,
  AdminCustomerListItem,
  AdminProduct,
  AdminReviewItem,
  Brand,
  Cart,
  Category,
  Coupon,
  CouponQuote,
  AdminDashboard,
  HomeData,
  ListResponse,
  Order,
  ProductDetail,
  ProductListItem,
  ProductQuery,
  Review,
  ShippingSettings,
  User,
  WishlistResponse,
} from "~/types";

type QueryResult<R> = { data: R } | { error: FetchBaseQueryError };

/** Convert a service `ApiError` into an RTK Query error object. */
function toRtkError(error: unknown): FetchBaseQueryError {
  if (error instanceof ApiError) {
    if (error.status === "FETCH_ERROR") {
      return { status: "FETCH_ERROR", error: "TypeError" };
    }
    return { status: error.status, data: error.payload };
  }
  return { status: "FETCH_ERROR", error: "UnknownError" };
}

/**
 * Wrap a service call into an RTK `queryFn`: resolves with `{ data }`,
 * rejects with a normalized `{ error }` so `.unwrap()` + `errorMessage()`
 * keep working unchanged.
 */
function call<A, R>(fn: (args: A) => Promise<R>) {
  return async (args: A): Promise<QueryResult<R>> => {
    try {
      return { data: await fn(args) };
    } catch (error) {
      return { error: toRtkError(error) };
    }
  };
}

export const api = createApi({
  reducerPath: "api",
  baseQuery: fakeBaseQuery<FetchBaseQueryError>(),
  tagTypes: [
    "Me",
    "Cart",
    "Wishlist",
    "Orders",
    "Order",
    "Products",
    "Product",
    "Categories",
    "Brands",
    "Reviews",
    "Addresses",
    "Coupons",
    "Settings",
    "Dashboard",
    "Customers",
  ],
  endpoints: (builder) => ({
    // ---- auth ----
    getMe: builder.query<User, void>({
      queryFn: call(() => authHttpService.getMe()),
      providesTags: ["Me"],
    }),
    login: builder.mutation<{ user: User }, LoginInput>({
      queryFn: call((body: LoginInput) => authHttpService.login(body)),
      invalidatesTags: ["Me", "Cart"],
    }),
    register: builder.mutation<{ user: User }, RegisterInput>({
      queryFn: call((body: RegisterInput) => authHttpService.register(body)),
      invalidatesTags: ["Me", "Cart"],
    }),
    logout: builder.mutation<{ ok: boolean }, void>({
      queryFn: call(() => authHttpService.logout()),
      invalidatesTags: ["Me", "Cart"],
    }),
    forgotPassword: builder.mutation<{ message: string }, { email: string }>({
      queryFn: call((body: { email: string }) =>
        authHttpService.forgotPassword(body),
      ),
    }),
    resetPassword: builder.mutation<
      { message: string },
      { token: string; password: string }
    >({
      queryFn: call((body: { token: string; password: string }) =>
        authHttpService.resetPassword(body),
      ),
    }),

    // ---- catalog ----
    getHome: builder.query<HomeData, void>({
      queryFn: call(() => productHttpService.getHome()),
      providesTags: ["Products"],
    }),
    getProducts: builder.query<ListResponse<ProductListItem>, ProductQuery>({
      queryFn: call((params: ProductQuery) =>
        productHttpService.getProducts(params),
      ),
      providesTags: ["Products"],
    }),
    getProduct: builder.query<ProductDetail, string>({
      queryFn: call((slug: string) => productHttpService.getProduct(slug)),
      providesTags: (_r, _e, slug) => [{ type: "Product", id: slug }],
    }),
    getCategories: builder.query<Category[], void>({
      queryFn: call(() => categoryHttpService.getCategories()),
      providesTags: ["Categories"],
    }),
    getBrands: builder.query<Brand[], void>({
      queryFn: call(() => brandHttpService.getBrands()),
      providesTags: ["Brands"],
    }),

    // ---- cart ----
    getCart: builder.query<Cart, void>({
      queryFn: call(() => cartHttpService.getCart()),
      providesTags: ["Cart"],
    }),
    addCartItem: builder.mutation<
      Cart,
      { productId: string; variantId?: string; qty: number }
    >({
      queryFn: call((body: { productId: string; variantId?: string; qty: number }) =>
        cartHttpService.addItem(body),
      ),
      invalidatesTags: ["Cart"],
    }),
    updateCartItem: builder.mutation<Cart, { id: string; qty: number }>({
      queryFn: call((args: { id: string; qty: number }) =>
        cartHttpService.updateItem(args),
      ),
      invalidatesTags: ["Cart"],
    }),
    removeCartItem: builder.mutation<Cart, string>({
      queryFn: call((id: string) => cartHttpService.removeItem(id)),
      invalidatesTags: ["Cart"],
    }),
    clearCart: builder.mutation<Cart, void>({
      queryFn: call(() => cartHttpService.clear()),
      invalidatesTags: ["Cart"],
    }),
    setCartCoupon: builder.mutation<Cart, string | null>({
      queryFn: call((code: string | null) => cartHttpService.setCoupon(code)),
      invalidatesTags: ["Cart"],
    }),
    validateCoupon: builder.mutation<
      CouponQuote,
      { code: string; subtotal: number }
    >({
      queryFn: call((body: { code: string; subtotal: number }) =>
        couponHttpService.validateCoupon(body),
      ),
    }),

    // ---- wishlist ----
    getWishlist: builder.query<WishlistResponse, void>({
      queryFn: call(() => wishlistHttpService.getWishlist()),
      providesTags: ["Wishlist"],
    }),
    addWishlistItem: builder.mutation<{ ok: boolean }, { productId: string }>({
      queryFn: call((body: { productId: string }) =>
        wishlistHttpService.addItem(body),
      ),
      invalidatesTags: ["Wishlist"],
    }),
    removeWishlistItem: builder.mutation<{ ok: boolean }, string>({
      queryFn: call((productId: string) =>
        wishlistHttpService.removeItem(productId),
      ),
      invalidatesTags: ["Wishlist"],
    }),
    moveToCart: builder.mutation<{ ok: boolean }, string>({
      queryFn: call((productId: string) =>
        wishlistHttpService.moveToCart(productId),
      ),
      invalidatesTags: ["Wishlist", "Cart"],
    }),

    // ---- orders ----
    createOrder: builder.mutation<Order, CreateOrderInput>({
      queryFn: call((body: CreateOrderInput) => orderHttpService.createOrder(body)),
      invalidatesTags: ["Cart", "Orders", "Products"],
    }),
    getMyOrders: builder.query<ListResponse<Order>, { page?: number; limit?: number }>({
      queryFn: call((params: { page?: number; limit?: number }) =>
        orderHttpService.getMyOrders(params),
      ),
      providesTags: ["Orders"],
    }),
    getOrder: builder.query<Order, string>({
      queryFn: call((id: string) => orderHttpService.getOrder(id)),
      providesTags: (_r, _e, id) => [{ type: "Order", id }],
    }),
    cancelOrder: builder.mutation<Order, { id: string; reason?: string }>({
      queryFn: call((args: { id: string; reason?: string }) =>
        orderHttpService.cancelOrder(args),
      ),
      invalidatesTags: ["Orders", "Order"],
    }),
    reorder: builder.mutation<{ added: string[]; skipped: string[] }, string>({
      queryFn: call((id: string) => orderHttpService.reorder(id)),
      invalidatesTags: ["Cart"],
    }),

    // ---- reviews ----
    getReviews: builder.query<
      ListResponse<Review>,
      { productId: string; page?: number; limit?: number }
    >({
      queryFn: call((params: { productId: string; page?: number; limit?: number }) =>
        reviewHttpService.getReviews(params),
      ),
      providesTags: ["Reviews"],
    }),
    createReview: builder.mutation<
      Review,
      { productId: string; rating: number; comment?: string }
    >({
      queryFn: call((body: { productId: string; rating: number; comment?: string }) =>
        reviewHttpService.createReview(body),
      ),
      invalidatesTags: ["Reviews", "Product", "Products"],
    }),
    updateReview: builder.mutation<
      Review,
      { id: string; rating: number; comment?: string }
    >({
      queryFn: call((args: { id: string; rating: number; comment?: string }) =>
        reviewHttpService.updateReview(args),
      ),
      invalidatesTags: ["Reviews", "Product", "Products"],
    }),
    deleteReview: builder.mutation<{ ok: boolean }, string>({
      queryFn: call((id: string) => reviewHttpService.deleteReview(id)),
      invalidatesTags: ["Reviews", "Product", "Products"],
    }),

    // ---- profile / addresses ----
    updateProfile: builder.mutation<User, { name?: string; phone?: string }>({
      queryFn: call((body: { name?: string; phone?: string }) =>
        userHttpService.updateProfile(body),
      ),
      invalidatesTags: ["Me"],
    }),
    changePassword: builder.mutation<
      { message: string },
      { currentPassword: string; newPassword: string }
    >({
      queryFn: call((body: { currentPassword: string; newPassword: string }) =>
        userHttpService.changePassword(body),
      ),
    }),
    getAddresses: builder.query<Address[], void>({
      queryFn: call(() => userHttpService.getAddresses()),
      providesTags: ["Addresses"],
    }),
    createAddress: builder.mutation<Address, Partial<Address>>({
      queryFn: call((body: Partial<Address>) => userHttpService.createAddress(body)),
      invalidatesTags: ["Addresses"],
    }),
    updateAddress: builder.mutation<Address, { id: string } & Partial<Address>>({
      queryFn: call((args: { id: string } & Partial<Address>) =>
        userHttpService.updateAddress(args),
      ),
      invalidatesTags: ["Addresses"],
    }),
    deleteAddress: builder.mutation<{ ok: boolean }, string>({
      queryFn: call((id: string) => userHttpService.deleteAddress(id)),
      invalidatesTags: ["Addresses"],
    }),

    // ---- settings ----
    getShippingSettings: builder.query<ShippingSettings, void>({
      queryFn: call(() => settingsHttpService.getShippingSettings()),
      providesTags: ["Settings"],
    }),

    // ---- admin ----
    adminDashboard: builder.query<AdminDashboard, void>({
      queryFn: call(() => dashboardHttpService.adminDashboard()),
      providesTags: ["Dashboard"],
    }),
    adminProducts: builder.query<
      ListResponse<AdminProduct>,
      ProductQuery & { includeInactive?: boolean }
    >({
      queryFn: call((params: ProductQuery & { includeInactive?: boolean }) =>
        productHttpService.adminProducts(params),
      ),
      providesTags: ["Products"],
    }),
    adminProduct: builder.query<AdminProduct, string>({
      queryFn: call((id: string) => productHttpService.adminProduct(id)),
      providesTags: (_r, _e, id) => [{ type: "Product", id }],
    }),
    adminCreateProduct: builder.mutation<AdminProduct, Partial<AdminProduct>>({
      queryFn: call((body: Partial<AdminProduct>) =>
        productHttpService.adminCreateProduct(body),
      ),
      invalidatesTags: ["Products"],
    }),
    adminUpdateProduct: builder.mutation<
      AdminProduct,
      { id: string } & Partial<AdminProduct>
    >({
      queryFn: call((args: { id: string } & Partial<AdminProduct>) =>
        productHttpService.adminUpdateProduct(args),
      ),
      invalidatesTags: ["Products"],
    }),
    adminDeleteProduct: builder.mutation<{ archived: boolean }, string>({
      queryFn: call((id: string) => productHttpService.adminDeleteProduct(id)),
      invalidatesTags: ["Products"],
    }),
    adminCategories: builder.query<Category[], void>({
      queryFn: call(() => categoryHttpService.adminCategories()),
      providesTags: ["Categories"],
    }),
    adminCreateCategory: builder.mutation<Category, Partial<Category>>({
      queryFn: call((body: Partial<Category>) =>
        categoryHttpService.adminCreateCategory(body),
      ),
      invalidatesTags: ["Categories"],
    }),
    adminUpdateCategory: builder.mutation<
      Category,
      { id: string } & Partial<Category>
    >({
      queryFn: call((args: { id: string } & Partial<Category>) =>
        categoryHttpService.adminUpdateCategory(args),
      ),
      invalidatesTags: ["Categories"],
    }),
    adminDeleteCategory: builder.mutation<{ ok: boolean }, string>({
      queryFn: call((id: string) => categoryHttpService.adminDeleteCategory(id)),
      invalidatesTags: ["Categories"],
    }),
    adminBrands: builder.query<Brand[], void>({
      queryFn: call(() => brandHttpService.adminBrands()),
      providesTags: ["Brands"],
    }),
    adminCreateBrand: builder.mutation<Brand, Partial<Brand>>({
      queryFn: call((body: Partial<Brand>) => brandHttpService.adminCreateBrand(body)),
      invalidatesTags: ["Brands"],
    }),
    adminUpdateBrand: builder.mutation<Brand, { id: string } & Partial<Brand>>({
      queryFn: call((args: { id: string } & Partial<Brand>) =>
        brandHttpService.adminUpdateBrand(args),
      ),
      invalidatesTags: ["Brands"],
    }),
    adminDeleteBrand: builder.mutation<{ ok: boolean }, string>({
      queryFn: call((id: string) => brandHttpService.adminDeleteBrand(id)),
      invalidatesTags: ["Brands"],
    }),
    adminCoupons: builder.query<ListResponse<Coupon>, { page?: number; limit?: number }>({
      queryFn: call((params: { page?: number; limit?: number }) =>
        couponHttpService.adminCoupons(params),
      ),
      providesTags: ["Coupons"],
    }),
    adminCreateCoupon: builder.mutation<Coupon, Partial<Coupon>>({
      queryFn: call((body: Partial<Coupon>) => couponHttpService.adminCreateCoupon(body)),
      invalidatesTags: ["Coupons"],
    }),
    adminUpdateCoupon: builder.mutation<Coupon, { id: string } & Partial<Coupon>>({
      queryFn: call((args: { id: string } & Partial<Coupon>) =>
        couponHttpService.adminUpdateCoupon(args),
      ),
      invalidatesTags: ["Coupons"],
    }),
    adminDeleteCoupon: builder.mutation<{ ok: boolean }, string>({
      queryFn: call((id: string) => couponHttpService.adminDeleteCoupon(id)),
      invalidatesTags: ["Coupons"],
    }),
    adminOrders: builder.query<
      ListResponse<Order>,
      { page?: number; limit?: number; status?: string; search?: string }
    >({
      queryFn: call(
        (params: { page?: number; limit?: number; status?: string; search?: string }) =>
          orderHttpService.adminOrders(params),
      ),
      providesTags: ["Orders"],
    }),
    adminOrder: builder.query<Order, string>({
      queryFn: call((id: string) => orderHttpService.adminOrder(id)),
      providesTags: (_r, _e, id) => [{ type: "Order", id }],
    }),
    adminUpdateOrderStatus: builder.mutation<
      Order,
      { id: string; status: string; note?: string; markPaid?: boolean }
    >({
      queryFn: call(
        (args: { id: string; status: string; note?: string; markPaid?: boolean }) =>
          orderHttpService.adminUpdateOrderStatus(args),
      ),
      invalidatesTags: ["Orders", "Order", "Dashboard", "Products"],
    }),
    adminCustomers: builder.query<
      ListResponse<AdminCustomerListItem>,
      { page?: number; limit?: number; search?: string }
    >({
      queryFn: call(
        (params: { page?: number; limit?: number; search?: string }) =>
          userHttpService.adminCustomers(params),
      ),
      providesTags: ["Customers"],
    }),
    adminCustomer: builder.query<AdminCustomerDetail, string>({
      queryFn: call((id: string) => userHttpService.adminCustomer(id)),
      providesTags: (_r, _e, id) => [{ type: "Customers", id }],
    }),
    adminSetCustomerBlocked: builder.mutation<
      { isActive: boolean },
      { id: string; blocked: boolean }
    >({
      queryFn: call((args: { id: string; blocked: boolean }) =>
        userHttpService.adminSetCustomerBlocked(args),
      ),
      invalidatesTags: ["Customers"],
    }),
    adminReviews: builder.query<
      ListResponse<AdminReviewItem>,
      { page?: number; limit?: number }
    >({
      queryFn: call((params: { page?: number; limit?: number }) =>
        reviewHttpService.adminReviews(params),
      ),
      providesTags: ["Reviews"],
    }),
    adminDeleteReview: builder.mutation<{ ok: boolean }, string>({
      queryFn: call((id: string) => reviewHttpService.adminDeleteReview(id)),
      invalidatesTags: ["Reviews", "Products"],
    }),
    adminGetSettings: builder.query<ShippingSettings, void>({
      queryFn: call(() => settingsHttpService.adminGetSettings()),
      providesTags: ["Settings"],
    }),
    adminUpdateSettings: builder.mutation<
      ShippingSettings,
      { shippingFee: number; freeShippingThreshold?: number | null }
    >({
      queryFn: call(
        (body: { shippingFee: number; freeShippingThreshold?: number | null }) =>
          settingsHttpService.adminUpdateSettings(body),
      ),
      invalidatesTags: ["Settings"],
    }),
    uploadImage: builder.mutation<{ url: string }, FormData>({
      queryFn: call((formData: FormData) => uploadHttpService.uploadImage(formData)),
    }),
  }),
});

export const {
  useGetMeQuery,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetHomeQuery,
  useGetProductsQuery,
  useGetProductQuery,
  useGetCategoriesQuery,
  useGetBrandsQuery,
  useGetCartQuery,
  useAddCartItemMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
  useSetCartCouponMutation,
  useValidateCouponMutation,
  useGetWishlistQuery,
  useAddWishlistItemMutation,
  useRemoveWishlistItemMutation,
  useMoveToCartMutation,
  useCreateOrderMutation,
  useGetMyOrdersQuery,
  useGetOrderQuery,
  useCancelOrderMutation,
  useReorderMutation,
  useGetReviewsQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useGetAddressesQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useGetShippingSettingsQuery,
  useAdminDashboardQuery,
  useAdminProductsQuery,
  useAdminProductQuery,
  useAdminCreateProductMutation,
  useAdminUpdateProductMutation,
  useAdminDeleteProductMutation,
  useAdminCategoriesQuery,
  useAdminCreateCategoryMutation,
  useAdminUpdateCategoryMutation,
  useAdminDeleteCategoryMutation,
  useAdminBrandsQuery,
  useAdminCreateBrandMutation,
  useAdminUpdateBrandMutation,
  useAdminDeleteBrandMutation,
  useAdminCouponsQuery,
  useAdminCreateCouponMutation,
  useAdminUpdateCouponMutation,
  useAdminDeleteCouponMutation,
  useAdminOrdersQuery,
  useAdminOrderQuery,
  useAdminUpdateOrderStatusMutation,
  useAdminCustomersQuery,
  useAdminCustomerQuery,
  useAdminSetCustomerBlockedMutation,
  useAdminReviewsQuery,
  useAdminDeleteReviewMutation,
  useAdminGetSettingsQuery,
  useAdminUpdateSettingsMutation,
  useUploadImageMutation,
} = api;
