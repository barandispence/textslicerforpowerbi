/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/
"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";
import { IBasicFilter, IFilterColumnTarget, BasicFilter } from "powerbi-models"
import FilterAction = powerbi.FilterAction

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost
import DataView = powerbi.DataView


import { VisualFormattingSettingsModel } from "./settings";



export class Visual implements IVisual {
    private target: HTMLElement
    private updateCount: number
    private textNode: Text
    private textNode2: Text
    private slicerValue: HTMLTextAreaElement
    private slicerValueArray: string[]
    private slicerValueArrayValidated: string[] = []
    private separator: string
    private visualHost: IVisualHost
    private dataView: DataView
    private visualUpdateOptions: VisualUpdateOptions

    constructor(options: VisualConstructorOptions) {
        console.log('Visual constructor', options)
        this.target = options.element
        this.updateCount = 0
        this.visualHost = options.host
        if (document) {
            this.slicerValue = document.createElement("textarea")
            this.slicerValue.addEventListener("keyup", this.slicerValueUpdate.bind(this))
            this.target.appendChild(this.slicerValue)
        }
    }

    //argüman boş geçtiği için optionsı resetliyor. bu sebeple dataview uçuyor. başka bir yöntem lazım.
    private slicerValueUpdate(): void {
        this.update(this.visualUpdateOptions as VisualUpdateOptions)
    }

    public update(options: VisualUpdateOptions) {
        this.visualUpdateOptions = options
        console.log(options.dataViews[0])
        
        this.textAreaToArray()

        if (this.slicerValueArray.length !== 0) {
            this.sliceTime(this.visualUpdateOptions)
        } else {
            this.clearSlicer()
        }
    }

    private getTargetColumn(dataView: DataView): string {
        const targetColumn = dataView.categorical.categories[0].source.displayName
        return targetColumn
    }

    private getTargetTable(dataView: DataView): string {
        const targetTable = dataView.categorical.categories[0].source.queryName.substring(0, dataView.categorical.categories[0].source.queryName.indexOf("."))
        return targetTable
    }

    private getTargetValues(dataView: DataView) {
        const targetValues = dataView.categorical.categories[0].values
        return targetValues
    }

    // removed. unneccesary to implement.
    // private targetValidification(dataView: DataView): void {
    //     this.getTargetValues(dataView).forEach((word) => {
    //         if (this.slicerValueArray.indexOf(word.toString()) !== -1) {
    //             this.slicerValueArrayValidated.push(word.toString())
    //         }
    //     })
    // }

    private textAreaToArray(): void {
        if (this.slicerValue.value) {
            this.slicerValueArray = this.slicerValue.value.split(this.separator)
        } else {
            this.slicerValueArray = []
        }
        
    }

    private sliceTime(options: VisualUpdateOptions): void {
        this.separator = ','
        const targetColumn = this.getTargetColumn(options.dataViews[0])
        const targetTable = this.getTargetTable(options.dataViews[0])

        const target: IFilterColumnTarget = {
            column: targetColumn,
            table: targetTable
        }

        const filter: IBasicFilter = {
            $schema: "http://powerbi.com/product/schema#basic",
            ...(new BasicFilter(
                target,
                "In",
                this.slicerValueArray
            ))
        }

        this.visualHost.applyJsonFilter(filter, "general", "filter", FilterAction.merge)
    }

    private clearSlicer() {
        this.visualHost.applyJsonFilter(null, "general", "filter", FilterAction.merge)
    }
}