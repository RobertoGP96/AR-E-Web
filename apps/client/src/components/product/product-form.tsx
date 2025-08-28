import { Box, Plus, Save, Tag, X, type LucideProps } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { useState } from "react"
import type { CreateProduc } from "@/types/product"
import { Textarea } from "../ui/textarea"
import { Badge } from "../ui/badge"
import { Popover } from "../ui/popover"
import { PopoverContent, PopoverTrigger } from "@radix-ui/react-popover"

type tag = {
    icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>,
    name: string,
    value: string
}

export const ProductForm = () => {
    const [newProduct, setNewProduct] = useState<CreateProduc>({
        description: "",
        link: "",
        name: "",
        shop: ""
    });
    const [tags, setTags] = useState<tag[]>([])
    const [newtag, setNewTag] = useState<tag>({
        icon: Tag,
        name:"",
        value:""
    })

    return (
        <div className="">
            <div className="flex flex-row justify-start items-center gap-2 pb-3">
                <Box className="h-12 w-12 text-primary" />
                <h1 className="text-primary text-[12px] m-0"> Nuevo Producto</h1>
            </div>
            <form action="#" method="POST" className="space-y-6 flex flex-col">
                <div>
                    <label htmlFor="name" className="block text-sm/6 font-medium text-gray-900 dark:text-gray-100">
                        Nombre*
                    </label>
                    <div className="mt-2">
                        <Input id="name" placeholder="...Escriba el nombre del producto" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
                    </div>
                </div>

                <div>
                    <label htmlFor="link" className="block text-sm/6 font-medium text-gray-900 dark:text-gray-100">
                        Link*
                    </label>
                    <div className="mt-2">
                        <Input id="link" placeholder="...Copie el link del producto." value={newProduct.link} onChange={(e) => setNewProduct({ ...newProduct, link: e.target.value })} />
                    </div>
                </div>
                <div>
                    <label htmlFor="shop" className="block text-sm/6 font-medium text-gray-900 dark:text-gray-100">
                        Shop
                    </label>
                    <div className="mt-2">
                        <Input id="shop" placeholder="...Escriba el nombre de la Tienda" value={newProduct.shop} onChange={(e) => setNewProduct({ ...newProduct, shop: e.target.value })} />
                    </div>
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm/6 font-medium text-gray-900 dark:text-gray-100">
                        Descripción
                    </label>
                    <div className="mt-2">
                        <Textarea id="descrption" placeholder="Añada las especificaciones de dicho producto. (Talla, Color, Modelo, etc)" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} />
                    </div>
                </div>
                <div className="w-full p-2">
                    <Popover>
                        <PopoverTrigger>
                            <Button className="rounded-full cursor-pointer" type="button">
                                <Tag />
                                <span>Añadir</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                            <div className="flex flex-col gap-2">
                                <h2>Nueva Etiqueta</h2>
                                <Input  value={newtag.name} onChange={(e)=> setNewTag({...newtag, name:e.target.value})} placeholder="Nombre"/>
                                <Input value={newtag.value} onChange={(e)=> setNewTag({...newtag, value:e.target.value})} placeholder="Valor"/>
                                <Button className="" onClick={()=>{
                                    const addTags=tags
                                    addTags.push(newtag)
                                    setTags(addTags)}}>
                                    <Plus/>
                                    <span>Añadir</span>
                                </Button>
                            </div>

                        </PopoverContent>
                    </Popover>

                    <div className="flex flex-row gap-2 justify-start items-center ">
                        {tags.map((item, index) => (
                            <Badge key={index}>
                                <item.icon />
                                <span>{item.value}</span>
                            </Badge>
                        ))}
                    </div>

                </div>


                <div className="w-full flex flex-row justify-end items-center gap-3 py-3">
                    <Button className="cursor-pointer" variant={"outline"} type={"reset"}>
                        <X />
                        <span>Cancelar</span>
                    </Button>
                    <Button className="cursor-pointer" type="submit">
                        <Save />
                        <span>Añadir</span>
                    </Button>
                </div>
            </form>
        </div>
    )
}