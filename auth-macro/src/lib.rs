use proc_macro::TokenStream;
use quote::quote;
use syn::{ItemFn, parse_macro_input, parse_quote};

/// A macro for adding auth to an axum endpoint
#[proc_macro_attribute]
pub fn auth_guard(_attr: TokenStream, item: TokenStream) -> TokenStream {
    let input = parse_macro_input!(item as ItemFn);
    let mut func_args = input.sig.inputs.clone();
    let func_vis = &input.vis;
    let func_asyncness = &input.sig.asyncness;
    let func_name = &input.sig.ident;
    let func_ret = &input.sig.output;
    let func_block = &input.block;

    // insert early in the arg sequence because axum needs requests to go at the bottom
    func_args.insert(0, parse_quote!(cookies: axum_extra::extract::CookieJar));

    let expanded = quote! {
        #func_vis #func_asyncness fn #func_name(#func_args) #func_ret {
            if cookies.get("beebfam-key").is_none_or(|val| val.value().trim() != state.key) {
                log::warn!("Access denied");
                return Err(AppError(anyhow::anyhow!("Nope, sorry")));
            }
            #func_block
        }
    };

    TokenStream::from(expanded)
}
