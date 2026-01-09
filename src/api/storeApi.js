import api from "@/api"

// store info
export const fetchStore = outletCode => {
  return api.get(
    `/api/method/ultipos.api.store.get_store`,
    { params: { outlet_code: outletCode } }
  )
}

// menu
export const fetchMenu = outletCode => {
  return api.get(
    `/api/method/ultipos.api.menu.get_menu`,
    { params: { outlet_code: outletCode } }
  )
}
